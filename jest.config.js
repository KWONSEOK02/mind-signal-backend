module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // 테스트에서도 절대 경로(@/) 인식
      '^@01-app/(.*)$': '<rootDir>/src/01-app/$1',
      '^@02-processes/(.*)$': '<rootDir>/src/02-processes/$1',
      '^@03-pages/(.*)$': '<rootDir>/src/03-pages/$1',
      '^@04-widgets/(.*)$': '<rootDir>/src/04-widgets/$1',
      '^@05-features/(.*)$': '<rootDir>/src/05-features/$1',
      '^@06-entities/(.*)$': '<rootDir>/src/06-entities/$1',
      '^@07-shared/(.*)$': '<rootDir>/src/07-shared/$1', // FSD 레이어 절대 경로 인식
    },
  };