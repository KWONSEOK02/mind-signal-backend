/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // (a) no-mongoose-in-features — 05-features 직접 mongoose/mongodb import 금지
    {
      name: 'no-mongoose-in-features',
      comment: 'Feature code must not import DB drivers directly — use 06-entities layer',
      severity: 'error',
      from: { path: '^src/05-features' },
      to: { path: '^(mongoose|mongodb)$' },
    },
    // (b) no-mongoose-direct-in-processes — 02-processes 직접 mongoose import 금지
    //     ※ 06-entities 서비스 경유 접근은 허용 (orchestration 특성)
    {
      name: 'no-mongoose-direct-in-processes',
      comment: 'Process orchestration must access DB via 06-entities, not mongoose directly',
      severity: 'error',
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
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(\\.test\\.ts|\\.spec\\.ts|__tests__)' },
  },
};
