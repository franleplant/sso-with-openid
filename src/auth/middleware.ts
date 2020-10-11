import { Request, Response, NextFunction } from "express";
import { Issuer } from "openid-client";
import { getAuthCookie } from "./cookie";

export function getDomain(): string {
  return `http://${process.env.HOST}:${process.env.PORT}`;
}

/*

Initialice two main things: the OpenId issuer and client,
these will be necessary for session management as
well as for authentication.

This is a direct dependency of the rest of the auth middlewares.


 */
export async function authInitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const googleIssuer = await Issuer.discover("https://accounts.google.com");
  req.auth = req.auth || {};
  req.auth.issuer = googleIssuer;

  const client = new googleIssuer.Client({
    client_id: process.env.OAUTH_CLIENT_ID!,
    client_secret: process.env.OAUTH_CLIENT_SECRET!,
    redirect_uris: [`${getDomain()}/auth/callback`],
    response_types: ["code"],
  });

  req.auth.client = client;

  next();
}

/*

  This middleware deals with sessions, which involves
  - turning the auth cookie into a valid session object
  - storing that session object in req.auth.session for other parts of the app to use
  - refreshing the access_token if necessary

 */
export async function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = getAuthCookie(req);
  if (!session) {
    return next();
  }

  if (session.tokenSet.expired()) {
    // TODO maybe build getters for these properties that throw?
    const client = req.auth?.client;
    if (!client) {
      return next(new Error("OAuth / OpenId client missing"));
    }

    const refreshedTokenSet = await client.refresh(session.tokenSet);
    session.tokenSet = refreshedTokenSet;
  }

  req.auth = req.auth || {};
  req.auth.session = session;

  next();
}

/*
  Helper middleware to protect certain routes.
  This will make those routes to be accessible only
  by already authenticated users.

  This is a very primitive version, a more complex one should.
  accept params like `if unauthenticated redirect to ...`
 */
export async function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = req.auth?.session;
  if (!session) {
    return next(new Error("unauthenticated"));
  }

  next();
}
