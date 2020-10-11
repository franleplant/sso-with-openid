import { TokenSet } from "openid-client";

export interface IUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export interface IAuthCookie {
  user: any;
  tokenSet: TokenSet;
}
