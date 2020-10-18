import debugFactory from "debug";
import { Router } from "express";
import { setSessionCookie, clearSessionCookie } from "./cookie";
import { serialize } from "./session";
import { getDomain } from "./middleware";
import {
  serializeAuthState,
  deserializeAuthState,
  setAuthStateCookie,
  getAuthStateCookie,
} from "./state";

const debug = debugFactory("myapp:routes");

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

  router.get("/auth/login", function (req, res, next) {
    const backToPath = (req.query.backTo as string) || "/private";
    const state = serializeAuthState({ backToPath });

    const authUrl = req.app.authClient!.authorizationUrl({
      scope: "openid email profile",
      state,
    });

    debug("setting state cookie %O", state);
    setAuthStateCookie(res, state);

    debug("redirecting to %s", authUrl);
    res.redirect(authUrl);
  });

  router.get("/auth/callback", async (req, res, next) => {
    debug("/auth/callback");
    try {
      const state = getAuthStateCookie(req);
      const { backToPath } = deserializeAuthState(state);

      debug("state %s %O", state, deserializeAuthState(state));
      const client = req.app.authClient;

      const params = client!.callbackParams(req);
      const tokenSet = await client!.callback(
        `${getDomain()}/auth/callback`,
        params,
        { state }
      );
      const user = await client!.userinfo(tokenSet);

      const sessionCookie = serialize({ tokenSet, user });
      setSessionCookie(res, sessionCookie);

      res.redirect(backToPath);
    } catch (err) {
      console.log("SOMETHING WENT WRONG", err);
      return next(err);
    }
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
    clearSessionCookie(res);

    res.redirect("/");
  });

  return router;
}
