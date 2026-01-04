import { faker } from '@faker-js/faker';

/**
 * 회원가입 테스트를 위한 가짜 데이터를 생성합니다.
 */
export const createFakeSignUpData = (overrides = {}) => {
  const password = faker.internet.password({ length: 10 });
  return {
    email: faker.internet.email(),
    password: password,
    passwordConfirm: password,
    name: faker.person.fullName(),
    loginType: 'local',
    ...overrides, // 특정 값만 고정하고 싶을 때 사용
  };
};
