/// <reference path="./declarations.d.ts" />
import express, { Request, Response, NextFunction } from "express";
import mustacheExpress from "mustache-express";
import cookieParser from "cookie-parser";

import {
  authInitMiddleware,
  sessionMiddleware,
  requireAuthMiddleware,
  authRoutesMiddleware,
} from "./auth";

const app = express();

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(cookieParser());

app.use(authInitMiddleware);
app.use(sessionMiddleware);
app.use(authRoutesMiddleware);

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

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});
