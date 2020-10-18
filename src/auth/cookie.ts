import { Request, Response } from "express";

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

const SESSION_COOKIE = "AUTH";

export function setSessionCookie(res: Response, session: string): void {
  res.cookie(SESSION_COOKIE, session, {
    httpOnly: true,
    expires: new Date(new Date().getTime() + 9000000),
  });
}

export function getSessionCookie(req: Request): string | undefined {
  return req.cookies[SESSION_COOKIE];
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}
