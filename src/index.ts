/// <reference path="./declarations.d.ts" />
import express, { Request, Response, NextFunction } from "express";
import mustacheExpress from "mustache-express";
import cookieParser from "cookie-parser";

import { Issuer, Client, TokenSet } from "openid-client";

import { IAuthCookie } from "./types";

function getDomain(): string {
  return `http://localhost:${process.env.PORT}`;
}

async function authInitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const googleIssuer = await Issuer.discover("https://accounts.google.com");
  console.log(
    "Discovered issuer %s %O",
    googleIssuer.issuer,
    googleIssuer.metadata
  );
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

// TODO user
function setAuthCookie(req: Request, tokenSet: TokenSet, user: any): void {
  const payload: IAuthCookie = { user, tokenSet };
  const value = JSON.stringify(payload);

  req.res?.cookie(AUTH_COOKIE, value, {
    httpOnly: true,
    maxAge: 100000,
  });
}

function getAuthCookie(req: Request): IAuthCookie | undefined {
  const value = req.cookies[AUTH_COOKIE];
  if (!value) {
    return;
  }

  return JSON.parse(value);
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

  req.auth = req.auth || {};
  req.auth.session = session;

  next();
}

async function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const session = req.auth?.session
  if (!session) {
    return next(new Error('unauthenticated'));
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

app.get("/private", requireAuthMiddleware, (req: Request, res: Response) => {
  res.render("private");
});

app.get("/auth/login", function (req: Request, res: Response) {
  const client = req.auth?.client;
  if (!client) {
    throw new Error("ouch");
  }

  const authUrl = client.authorizationUrl({
    scope: "openid",
  });
  res.redirect(authUrl);
});

app.get("/auth/callback", async (req: Request, res: Response) => {
  const client = req.auth?.client;
  if (!client) {
    throw new Error("ouch");
  }
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(
    `${getDomain()}/auth/callback`,
    params
  );
  console.log("auth callback", tokenSet);
  const user = await client.userinfo(tokenSet);

  setAuthCookie(req, tokenSet, user);

  res.redirect("/private");
});

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});
