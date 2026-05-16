/**
 * migrate-2026-05-16-pr-a8-subject-index.ts — subjectIndex legacy 마이그레이션 스크립트
 *
 * PR-A8 invariant locality 도입 후 null subjectIndex 레코드 분류 및 수정함.
 * dry-run 모드: 분류 결과 stdout 출력만 (DB 쓰기 0건).
 * apply 모드: auto-fix 카테고리만 group_counters 기반 재할당 + 트랜잭션 처리함.
 *
 * 분류 4종:
 *   - no-op: subjectIndex >= 1 (정상)
 *   - auto-fix: CREATED + 미만료 (counter 기반 재할당 가능)
 *   - manual-block: CREATED 만료 / EXPIRED (수동 처리 필요)
 *   - paired-legacy: PAIRED / MEASURING / COMPLETED / CANCELLED (시연 기록 보존)
 *
 * 실행: npm run migrate:pr-a8:dry-run  또는  npm run migrate:pr-a8:apply
 */

import mongoose, { ClientSession } from 'mongoose';
import { Session } from '../src/06-entities/sessions/model/session.schema';

type Mode = 'dry-run' | 'apply';
type Category = 'auto-fix' | 'manual-block' | 'paired-legacy' | 'no-op';

interface ClassifiedDoc {
  _id: string;
  category: Category;
  reason: string;
  currentSubjectIndex: number | null;
  proposedSubjectIndex?: number;
}

async function classify(): Promise<ClassifiedDoc[]> {
  // R3-M4 amend: 무한 스캔 가드 — 실험 규모 초과 시 운영자 batch 안내
  const totalCount = await Session.countDocuments({});
  if (totalCount > 10_000) {
    console.warn(
      `[migrate-pr-a8] WARNING: ${totalCount} sessions (> 10000) — batch 모드 권장. 운영자 검토 의무.`
    );
  }
  const docs = await Session.find({}).lean();
  const now = new Date();
  return docs.map((d) => {
    if (d.subjectIndex != null && d.subjectIndex >= 1) {
      return {
        _id: String(d._id),
        category: 'no-op',
        reason: 'valid',
        currentSubjectIndex: d.subjectIndex,
      };
    }
    // CREATED + 미만료 = auto-fix
    if (d.status === 'CREATED' && d.expiresAt > now) {
      return {
        _id: String(d._id),
        category: 'auto-fix',
        reason: 'CREATED + not expired',
        currentSubjectIndex: d.subjectIndex,
      };
    }
    // M4 amend: CREATED 인데 이미 만료(status 아직 EXPIRED 미전이) legacy — manual-block 명시 분류
    if (d.status === 'CREATED' && d.expiresAt <= now) {
      return {
        _id: String(d._id),
        category: 'manual-block',
        reason: 'CREATED + expired (status 미전이 legacy)',
        currentSubjectIndex: d.subjectIndex,
      };
    }
    if (d.status === 'EXPIRED') {
      return {
        _id: String(d._id),
        category: 'manual-block',
        reason: 'EXPIRED + legacy',
        currentSubjectIndex: d.subjectIndex,
      };
    }
    // 잔여 = PAIRED / MEASURING / COMPLETED / CANCELLED (DISCUSS Q2 paired-legacy contract 정합)
    return {
      _id: String(d._id),
      category: 'paired-legacy',
      reason: `status=${d.status} + legacy (시연 기록 보존)`,
      currentSubjectIndex: d.subjectIndex,
    };
  });
}

// H6 amend: 트랜잭션 session을 인자로 받아 counter $inc도 동일 트랜잭션에 포함
async function reassignFromCounter(
  groupId: string,
  session: ClientSession
): Promise<number> {
  // M3 amend: connection.db! 비단언 — 명시 가드
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not established');
  const counter = await db
    .collection<{ groupId: string; seq: number }>('group_counters')
    .findOneAndUpdate(
      { groupId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after', session }
    );
  const next = counter?.seq;
  if (!next || next <= 0)
    throw new Error(`group_counters $inc failed for ${groupId}`);
  return next;
}

async function main(mode: Mode): Promise<number> {
  // M3 amend: process.env.MONGODB_URI! 비단언 — 명시 가드 (미설정 시 에러 shape 명확)
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    const classified = await classify();
    const byCategory: Record<Category, ClassifiedDoc[]> = {
      'auto-fix': classified.filter((c) => c.category === 'auto-fix'),
      'manual-block': classified.filter((c) => c.category === 'manual-block'),
      'paired-legacy': classified.filter((c) => c.category === 'paired-legacy'),
      'no-op': classified.filter((c) => c.category === 'no-op'),
    };

    console.log(`[migrate-pr-a8] mode=${mode} total=${classified.length}`);
    console.log(`[migrate-pr-a8] no-op: ${byCategory['no-op'].length} docs`);
    console.log(
      `[migrate-pr-a8] auto-fix: ${byCategory['auto-fix'].length} docs`
    );
    console.log(
      `[migrate-pr-a8] manual-block: ${byCategory['manual-block'].length} docs`
    );
    console.log(
      `[migrate-pr-a8] paired-legacy: ${byCategory['paired-legacy'].length} docs`
    );
    byCategory['auto-fix'].forEach((d) =>
      console.log(`  auto-fix: ${d._id} (${d.reason})`)
    );
    byCategory['manual-block'].forEach((d) =>
      console.log(`  manual-block: ${d._id} (${d.reason})`)
    );
    byCategory['paired-legacy'].forEach((d) =>
      console.log(`  paired-legacy: ${d._id} (${d.reason})`)
    );

    if (mode === 'dry-run') {
      return 0;
    }

    // apply mode
    if (
      byCategory['manual-block'].length > 0 ||
      byCategory['paired-legacy'].length > 0
    ) {
      console.error(
        '[migrate-pr-a8] APPLY BLOCKED — manual-block or paired-legacy detected. Resolve manually first.'
      );
      return 1;
    }

    // R3-H3 amend: apply 직전 group별 counter preflight — seq를 기존 max(subjectIndex)로 동기화
    async function preflightCounter(
      groupId: string,
      session: ClientSession
    ): Promise<void> {
      const db = mongoose.connection.db;
      if (!db) throw new Error('MongoDB connection not established');
      const maxDoc = await Session.find({
        groupId,
        subjectIndex: { $ne: null },
      })
        .sort({ subjectIndex: -1 })
        .limit(1)
        .session(session)
        .lean();
      const existingMax = maxDoc[0]?.subjectIndex ?? 0;
      await db
        .collection<{ groupId: string; seq: number }>('group_counters')
        .updateOne(
          { groupId },
          { $max: { seq: existingMax } },
          { upsert: true, session }
        );
    }

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        // group 단위 preflight 1회
        const seenGroups = new Set<string>();
        for (const doc of byCategory['auto-fix']) {
          const original = await Session.findById(doc._id).session(
            mongoSession
          );
          if (!original) continue;
          if (!seenGroups.has(original.groupId)) {
            await preflightCounter(original.groupId, mongoSession);
            seenGroups.add(original.groupId);
          }
          const newIndex = await reassignFromCounter(
            original.groupId,
            mongoSession
          );
          original.subjectIndex = newIndex;
          try {
            await original.save({ session: mongoSession });
          } catch (e: unknown) {
            // R3-H2 amend: E11000 (groupId+subjectIndex sparse unique) 명시 처리
            const code = (e as { code?: number }).code;
            if (code === 11000) {
              throw new Error(
                `group ${original.groupId} subjectIndex=${newIndex} collision (E11000) — manual resolve required`
              );
            }
            throw e;
          }
          console.log(`  auto-fixed: ${doc._id} → subjectIndex=${newIndex}`);
        }
      });
    } finally {
      await mongoSession.endSession();
    }
    return 0;
  } finally {
    // M5/M6 amend: 정상·early-return·throw 전 경로 disconnect 보장
    await mongoose.disconnect();
  }
}

const mode: Mode = process.argv.includes('--apply') ? 'apply' : 'dry-run';
// M5 amend: process.exit() 직접 호출 제거 — 파이프 stdout truncation 차단
// process.exitCode 설정 + 자연 종료로 stdout flush 보장
main(mode)
  .then((code) => {
    process.exitCode = code;
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 2; // disconnect는 main() finally가 이미 수행
  });
