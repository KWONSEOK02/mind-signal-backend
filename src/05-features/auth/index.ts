export { default as authService } from './services/auth.service';
export { default as authApi } from './api/auth.routes';
export { loginSchema, signUpSchema } from './dto/auth.dto';
export type { LoginDto, SignUpDto } from './dto/auth.dto';
export {
  socialLoginSchema,
  socialProviderSchema,
  socialTokenSchema,
} from './dto/social-auth.dto';
export type {
  SocialLoginDto,
  SocialProviderDto,
  SocialTokenDto,
} from './dto/social-auth.dto';
export type {
  SocialUserInfo,
  IAuthProvider,
} from './services/providers/auth-provider.interface';
