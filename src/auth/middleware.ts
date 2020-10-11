import { Request, Response, NextFunction } from "express";
import { Issuer } from "openid-client";
import { getAuthCookie } from "./cookie";

export function getDomain(): string {
  return `http://localhost:${process.env.PORT}`;
}

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
