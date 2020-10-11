import { Request } from "express";
import { TokenSet } from "openid-client";
import { IAuthCookie, IUserInfo } from "../types";

const AUTH_COOKIE = "AUTH";

export function setAuthCookie(
  req: Request,
  tokenSet: TokenSet,
  user: IUserInfo
): void {
  const payload: IAuthCookie = { user, tokenSet };
  const value = JSON.stringify(payload);

  req.res?.cookie(AUTH_COOKIE, value, {
    httpOnly: true,
    expires: new Date(new Date().getTime() + 9000000),
  });
}

export function getAuthCookie(req: Request): IAuthCookie | undefined {
  const value = req.cookies[AUTH_COOKIE];
  if (!value) {
    return;
  }

  const raw = JSON.parse(value);
  return {
    ...raw,
    tokenSet: new TokenSet(raw.tokenSet),
  };
}

export function clearAuthCookie(req: Request): void {
  req.res?.clearCookie(AUTH_COOKIE);
}
