import bcrypt from "bcryptjs";
// import User, { UserDoc } from "@models/User"; 
// import userService from "@services/user.service";
// import AppError from "@07-shared/errors/app.error"; 

// // 반환 타입을 구체적인 UserDoc으로 변경
// type AuthResult = {
//   user: UserDoc;
//   token: string;
// };

// type LoginWithEmailParams = {
//   email: string;
//   password: string;
// };


// //회원가입을 처리하고 토큰을 발급하는 함수
// //@param createUserData 회원가입에 필요한 데이터
// //@returns 생성된 사용자와 인증 토큰
 
// async function register(createUserData: any): Promise<AuthResult> {
//   const { passwordConfirm, ...userData } = createUserData;
//   const user = await userService.createUser(userData);
//   const token: string = await user.generateToken();
//   return { user, token };
// }

// async function loginWithEmail({ email, password }: LoginWithEmailParams): Promise<AuthResult> {
//   // 1. DB에서 비밀번호를 포함하여 사용자를 조회
//   const user = await User.findOne({ email }).select("+password");

//   // 2. 사용자가 없거나 비밀번호가 일치하지 않으면 AppError를 발생
//   if (!user || !bcrypt.compareSync(password, user.password)) {
//     throw new AppError("아이디 또는 비밀번호가 일치하지 않습니다", 401);
//   }

//   // 3. 토큰을 생성하고 반환. toJSON 메서드가 응답에서 비밀번호를 제거
//   const token: string = await user.generateToken();
//   return { user, token };
// }

// async function getUser(userId: string): Promise<UserDoc> {
//   // DB 조회 시 비밀번호를 명시적으로 제외
//   const user = await User.findById(userId).select("-password");
  
//   if (!user) {
//     throw new AppError("사용자를 찾을 수 없습니다.", 404);
//   }
//   return user;
// }

// const authService = {
//   register,
//   loginWithEmail,
//   getUser,
// };

// export default authService;