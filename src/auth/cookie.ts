import { Request } from "express";
import { TokenSet } from "openid-client";
import { IAuthCookie, IUserInfo } from "../types";

/*

  This module deals with the auth cookie.
  We are using a very simple approach of storing
  the whole session object as a cookie so that it can be self contained.
  This fits well with horizontally scalable architectures such as microservices
  as oposed to the more traditional statefull session id. Both are valid, this
  one is much simpler.

  We are storing the session object stringified but a more common approach is to
  encode it to make it smaller such as using base64 encoding.

  This module ONLY deals with parsing the session object into a cookie and back
  into a session object and clearing it, no token management is done in this module.
 */

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
