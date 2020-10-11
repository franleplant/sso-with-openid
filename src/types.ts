import { TokenSet } from "openid-client";

export interface IAuthCookie {
  user: any;
  tokenSet: TokenSet;
}
