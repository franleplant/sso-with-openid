import { Router } from "express";
import { setSessionCookie, clearSessionCookie } from "./cookie";
import { serialize } from "./session";
import { getDomain } from "./middleware";

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
  const BACKTO_COOKIE = "backTo";

  router.get("/auth/login", function (req, res, next) {
    const backTo = req.query.backTo;
    const authUrl = req.app.authClient!.authorizationUrl({
      scope: "openid email profile",
    });

    res.cookie(BACKTO_COOKIE, backTo);
    res.redirect(authUrl);
  });

  router.get("/auth/callback", async (req, res, next) => {
    const backTo = req.cookies[BACKTO_COOKIE] || "/private";
    const client = req.app.authClient;

    const params = client!.callbackParams(req);
    const tokenSet = await client!.callback(
      `${getDomain()}/auth/callback`,
      params
    );
    const user = await client!.userinfo(tokenSet);

    const sessionCookie = serialize({ tokenSet, user });
    setSessionCookie(req, sessionCookie);

    res.redirect(backTo);
  });

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
