import { Router } from "express";
import { IUserInfo } from "../types";
import { setAuthCookie, clearAuthCookie } from "./cookie";
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

  router.get("/auth/login", function (req, res, next) {
    const client = req.auth?.client;
    if (!client) {
      return next(new Error("OAuth / OpenId client missing"));
    }

    const authUrl = client.authorizationUrl({
      scope: "openid email profile",
    });
    res.redirect(authUrl);
  });

  router.get("/auth/callback", async (req, res, next) => {
    const client = req.auth?.client;
    if (!client) {
      return next(new Error("OAuth / OpenId client missing"));
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

  router.get("/auth/logout", async (req, res, next) => {
    const client = req.auth?.client;
    if (!client) {
      return next(new Error("OAuth / OpenId client missing"));
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

  return router;
}
