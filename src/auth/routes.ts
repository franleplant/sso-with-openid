import { Router } from "express";
import {generators} from 'openid-client'
import { setSessionCookie, clearSessionCookie } from "./cookie";
import { serialize } from "./session";
import { getDomain } from "./middleware";

interface IState {
  backToPath: string;
  bytes: string;
}

function serializeAuthState(state: Partial<IState>): string {
  // probably you would base64 encode this
  return JSON.stringify({
    ...state,
    bytes: generators.state()
  })
}

function deserializeAuthState(value: string): IState {
  return JSON.parse(value)
}

/*
  This is a simple middleware that hosts all the routes
  necessary to manage authentication. In here you are going
  to see the vital routes:
  - auth/login which inits the whole oAuth flow
  - auth/callback which is the thing that the openId provider will call to finish the auth process


  We are also including a logout route and others might be included
  such as a `userinfo` proxy among others.

 */
export default function authRoutesMiddleware(): Router {
  const router = Router();
  const STATE_COOKIE = "state";

  router.get("/auth/login", function (req, res, next) {
    const backToPath = req.query.backTo as string || "/private";
    const state = serializeAuthState({backToPath})
    const authUrl = req.app.authClient!.authorizationUrl({
      scope: "openid email profile",
      state,
    });

    res.cookie(STATE_COOKIE, state);
    res.redirect(authUrl);
  });

  router.get("/auth/callback", async (req, res, next) => {
    const state = req.cookies[STATE_COOKIE];
    const client = req.app.authClient;

    const params = client!.callbackParams(req);
    const tokenSet = await client!.callback(
      `${getDomain()}/auth/callback`,
      params,
      {state}
    );
    const user = await client!.userinfo(tokenSet);

    const sessionCookie = serialize({ tokenSet, user });
    setSessionCookie(req, sessionCookie);

    const {backToPath} = deserializeAuthState(state)
    res.redirect(backToPath);
  });

  //TODO
  router.get("/auth/logout", async (req, res, next) => {
    const client = req.app.authClient;
    const tokenSet = req.session?.tokenSet;

    try {
      await client!.revoke(tokenSet!.access_token!);
    } catch (err) {
      console.error("error revoking token", err);
    }
    clearSessionCookie(req);

    res.redirect("/");
  });

  return router;
}
