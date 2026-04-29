import { addPairingCompleteListener } from '@05-features/sessions/services/pairing.service';
import { addOperatorJoinListener } from '@05-features/sessions/services/join-operator.service';
import {
  dualTriggerService,
  operatorJoinedGroups,
} from '@02-processes/engine/services/dual-2pc-trigger.service';

let listenersRegistered = false;

/**
 * BE startup 시 pairing + operator-join listener 등록함.
 * LD-32: 중복 호출 시 idempotent 보장됨.
 * 호출 위치: src/01-app/app.ts의 connectDB() 내부, MongoDB 연결 직후 (LD-23).
 *
 * @returns true — 최초 등록 성공, false — 이미 등록됨
 */
export function registerPairingTriggerListener(): boolean {
  if (listenersRegistered) return false;

  // 페어링 완료 → 3조건 체크 + 자동 trigger 처리함
  addPairingCompleteListener(async ({ groupId }) => {
    await dualTriggerService.maybeTriggerDualAssignGroup(groupId);
  });

  // operator join 완료 → 플래그 등록 + 3조건 체크 처리함
  addOperatorJoinListener(async ({ groupId }) => {
    operatorJoinedGroups.add(groupId);
    await dualTriggerService.maybeTriggerDualAssignGroup(groupId);
  });

  listenersRegistered = true;
  return true;
}
