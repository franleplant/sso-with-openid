/// <reference path="./declarations.d.ts" />
import express, { Request, Response } from "express";
import mustacheExpress from "mustache-express";
import cookieParser from "cookie-parser";

import * as auth from "./auth";

// To test the SSO we need to use two different hosts
// because of the cookie domain (localhost cookie domain
// doesn't include the port, so both apps would be using the same
// cookie domain and auth).
// So one easy way of doing so is to run one app with localhost
// and the other for 127.0.0.1 (which are totally the same) but
// in terms of cookie domain they are distinct.
// You could do something more fancy like adding custom domains
// to your hosts file and that would work too.
console.log(`
 USING
 HOST: ${process.env.HOST}
 PORT: ${process.env.PORT}
 OAUTH_CLIENT_ID: ${process.env.OAUTH_CLIENT_ID}
 OAUTH_CLIENT_secret: ${process.env.OAUTH_CLIENT_SECRET}
`);

const app = express();

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(cookieParser());

app.use(auth.initialize);
app.use(auth.session);
app.use(auth.routes);

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.get("/private", auth.requireAuth, (req, res) => {
  const claims = req.session!.tokenSet.claims();

  res.render("private", {
    email: claims.email,
    picture: claims.picture,
    name: claims.name,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Express started on port ${process.env.PORT}`);
});
