# 5. 📁 프로젝트 구조
```
mind-signal-backend/
├── node_modules/ # Node.js 모듈
├── src/ # 애플리케이션 소스 코드
│ ├── 01-app/ # 애플리케이션의 엔트리 포인트, 전역 설정, 라우터 정의
│ │ ├── app.router.ts
│ │ └── app.ts
│ ├── 02-processes/ # 비즈니스 프로세스 및 워크플로우 (여러 피처를 조합)
│ ├── 03-pages/ # 페이지 수준의 로직 (현재는 백엔드이므로 비어있을 수 있음)
│ ├── 04-widgets/ # 위젯 (재사용 가능한 UI 컴포넌트, 백엔드에서는 드물게 사용)
│ ├── 05-features/ # 특정 기능 구현 (예: 인증, 사용자 관리)
│ │ ├── analyze-eeg/ # EEG 분석 기능
│ │ │ ├── api/
│ │ │ └── model/
│ │ └── auth-by-email/ # 이메일 기반 인증 기능
│ │ └── auth.service.ts
│ ├── 06-entities/ # 도메인 엔티티 (데이터 모델, 스키마, CRUD 로직)
│ │ ├── eeg-log/ # EEG 로그 엔티티
│ │ │ ├── lib/
│ │ │ └── model/
│ │ ├── session/ # 세션 엔티티
│ │ └── user/ # 사용자 엔티티
│ └── 07-shared/ # 범용 유틸리티, 설정, 상수 (어디서든 사용 가능)
│ ├── api/ # 공통 API 클라이언트 또는 유틸리티
│ ├── config/ # 환경 설정 (예: 데이터베이스 연결 정보)
│ │ └── config.ts
│ └── lib/ # 공통 라이브러리, 헬퍼 함수
├── .env.development # 개발 환경 변수 (Git 추적 제외)
├── .env.example # 환경 변수 템플릿 (Git 추적)
├── .env.local # 로컬 환경 변수 (Git 추적 제외)
├── .env.test # 테스트 환경 변수 (Git 추적 제외)
├── .eslintrc.json # ESLint 설정 파일
├── .gitignore # Git이 무시할 파일 및 폴더 목록
├── jest.config.js # Jest 테스트 설정 파일
├── package-lock.json # 패키지 의존성 잠금 파일
├── package.json # 프로젝트 메타데이터 및 스크립트
├── README.md # 프로젝트 설명 파일
└── tsconfig.json # TypeScript 컴파일러 설정 파일
```