/** @type {import('dependency-cruiser').IConfiguration} */
// advisory 기간(D+14): DEPCRUISE_BLOCKING=true 시 'error', 미설정 시 'warn'으로 동작함
const fsdBoundarySeverity =
  process.env.DEPCRUISE_BLOCKING === 'true' ? 'error' : 'warn';

module.exports = {
  forbidden: [
    // (a) no-mongoose-in-features — 05-features 직접 mongoose/mongodb import 금지
    {
      name: 'no-mongoose-in-features',
      comment: 'Feature code must not import DB drivers directly — use 06-entities layer',
      severity: fsdBoundarySeverity,
      from: { path: '^src/05-features' },
      to: { path: '^(mongoose|mongodb)$' },
    },
    // (b) no-mongoose-direct-in-processes — 02-processes 직접 mongoose import 금지
    //     ※ 06-entities 서비스 경유 접근은 허용 (orchestration 특성)
    {
      name: 'no-mongoose-direct-in-processes',
      comment: 'Process orchestration must access DB via 06-entities, not mongoose directly',
      severity: fsdBoundarySeverity,
      from: { path: '^src/02-processes' },
      to: { path: '^(mongoose|mongodb)$' },
    },
    // (c) no-upward-from-shared — 07-shared에서 상위 레이어 import 금지
    {
      name: 'no-upward-from-shared',
      comment: 'Shared layer must not import from upper FSD layers',
      severity: 'error',
      from: { path: '^src/07-shared' },
      to: {
        path: '^src/(06-entities|05-features|04-widgets|03-pages|02-processes|01-app)',
      },
    },
    // (d) no-fs-in-features — 05-features에서 fs/path 직접 접근 금지 (07-shared/lib 경유 필수)
    {
      name: 'no-fs-in-features',
      comment: 'Features must not access filesystem directly — route through 07-shared/lib',
      severity: 'error',
      from: { path: '^src/05-features' },
      to: { path: '^(fs|path|node:fs|node:path)$' },
    },
    // (e) R-DDD-1 no-mongoose-in-domain — 도메인 레이어는 Mongoose 또는 schema 파일 import 금지
    //     순수 타입(session.types.ts)은 정규식이 .schema$만 매칭하므로 허용됨
    //     @07-shared/constants/experiment (ExperimentMode single source)도 본 규칙 차단 대상 외
    {
      name: 'no-mongoose-in-domain',
      comment: '도메인 레이어는 Mongoose 또는 schema 파일 import 금지 (순수 타입 파일은 허용)',
      severity: 'error',
      from: { path: '^src/06-entities/sessions/domain/' },
      to: { path: '(^mongoose$|^src/06-entities/sessions/model/session\\.schema$)' },
    },
    // (f) R-DDD-2 no-redis-socket-in-domain — 도메인 레이어는 인프라(Redis/Socket.io) import 금지
    //     @07-shared/constants/* 는 본 규칙 정규식이 lib/(redis|socket)만 매칭하므로 허용됨
    {
      name: 'no-redis-socket-in-domain',
      comment: '도메인 레이어는 인프라(Redis/Socket.io)에 의존할 수 없음',
      severity: 'error',
      from: { path: '^src/06-entities/sessions/domain/' },
      to: { path: '^src/07-shared/lib/(redis|socket)' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(\\.test\\.ts|\\.spec\\.ts|__tests__)' },
  },
};
