import { Request, Response, NextFunction } from "express";
import { Issuer } from "openid-client";
import { clearSessionCookie, getSessionCookie } from "./cookie";
import { deserialize } from "./session";

export function getDomain(): string {
  return `http://${process.env.HOST}:${process.env.PORT}`;
}

/*

Initialice two main things: the OpenId issuer and client,
these will be necessary for session management as
well as for authentication.

This is a direct dependency of the rest of the auth middlewares.


 */
export async function initialize(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.app.authIssuer) {
    return next();
  }

  const googleIssuer = await Issuer.discover("https://accounts.google.com");
  console.log("OpendId issuer created");
  const client = new googleIssuer.Client({
    client_id: process.env.OAUTH_CLIENT_ID!,
    client_secret: process.env.OAUTH_CLIENT_SECRET!,
    redirect_uris: [`${getDomain()}/auth/callback`],
    response_types: ["code"],
  });

  req.app.authIssuer = googleIssuer;
  req.app.authClient = client;

  next();
}

/*

  This middleware deals with sessions, which involves
  - turning the auth cookie into a valid session object
  - storing that session object in req.auth.session for other parts of the app to use
  - refreshing the access_token if necessary

 */
export async function session(req: Request, res: Response, next: NextFunction) {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    return next();
  }

  const session = deserialize(sessionCookie);

  const client = req.app.authClient;
  // This is unfortunately a private method for some reason,
  // The idea here is to use the metadata the issuer fetched like
  // encryption algorithms and public keys to validate that
  // the idToken's signature, meaning that we validate that it was issued
  // by our real openId identity provider.
  // We also need to do this because when the TokenSet is instanciated "by hand"
  // there are no validations performed by the lib.
  const validate = req.app.authClient?.validateIdToken as any;
  // due to javascript weirdness this class method needs to be called this way
  // so that it is aware of its own `this`
  try {
    await validate.call(client, session.tokenSet);
  } catch (err) {
    console.log("bad token signature found in auth cookie");
    return next(new Error("Bad Token in Auth Cookie!"));
  }

  if (session.tokenSet.expired()) {
    try {
      const refreshedTokenSet = await req.app.authClient!.refresh(
        session.tokenSet
      );
      session.tokenSet = refreshedTokenSet;
    } catch (err) {
      // this can throw when the refresh token has expired, logout completely when that happens
      clearSessionCookie(req);
      return next();
    }
  }

  req.session = session;

  next();
}

/*
  Helper middleware to protect certain routes.
  This will make those routes to be accessible only
  by already authenticated users.

  This is a very primitive version, a more complex one should.
  accept params like `if unauthenticated redirect to ...`
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = req.session;
  if (!session) {
    return next(new Error("unauthenticated"));
  }

  next();
}
