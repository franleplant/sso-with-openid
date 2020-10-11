/// <reference path="./declarations.d.ts" />
import express, { Request, Response, NextFunction } from "express";
import mustacheExpress from "mustache-express";
import cookieParser from "cookie-parser";

import { Issuer, Client, TokenSet } from "openid-client";

import { IAuthCookie, IUserInfo } from "./types";

function getDomain(): string {
  return `http://localhost:${process.env.PORT}`;
}

async function authInitMiddleware(
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

const AUTH_COOKIE = "AUTH";

function setAuthCookie(
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

function getAuthCookie(req: Request): IAuthCookie | undefined {
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

function clearAuthCookie(req: Request): void {
  req.res?.clearCookie(AUTH_COOKIE);
}

async function sessionMiddleware(
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
      throw new Error("ouch");
    }

    const refreshedTokenSet = await client.refresh(session.tokenSet);
    session.tokenSet = refreshedTokenSet;
  }

  req.auth = req.auth || {};
  req.auth.session = session;

  next();
}

async function requireAuthMiddleware(
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

const app = express();

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(cookieParser());

app.use(authInitMiddleware);
app.use(sessionMiddleware);

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.get("/private", requireAuthMiddleware, (req, res, next) => {
  const claims = req.auth!.session!.tokenSet.claims();

  res.render("private", {
    email: claims.email,
    picture: claims.picture,
    name: claims.name,
  });
});

app.get("/auth/login", function (req, res, next) {
  const client = req.auth?.client;
  if (!client) {
    return next( new Error("OAuth / OpenId client missing"))
  }

  const authUrl = client.authorizationUrl({
    scope: "openid email profile",
  });
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req, res, next) => {
  const client = req.auth?.client;
  if (!client) {
    return next( new Error("OAuth / OpenId client missing"))
  }

  const params = client.callbackParams(req);
  const tokenSet = await client.callback(
    `${getDomain()}/auth/callback`,
    params
  );
  const user = await client.userinfo(tokenSet);

  setAuthCookie(req, tokenSet, user as IUserInfo);

  res.redirect("/private");
});

app.get("/auth/logout", async (req, res, next) => {
  const client = req.auth?.client;
  if (!client) {
    return next( new Error("OAuth / OpenId client missing"))
  }

  const tokenSet = req.auth?.session?.tokenSet;

  try {
    await client.revoke(tokenSet!.access_token!);
  } catch (err) {
    console.error("error revoking token", err);
  }
  clearAuthCookie(req);

  res.redirect("/");
});

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});
