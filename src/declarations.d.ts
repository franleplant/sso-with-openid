import { Issuer, Client } from "openid-client";
import { ISession } from "./auth";

declare global {
  namespace Express {
    export interface Application {
      authIssuer?: Issuer;
      authClient?: Client;
    }

    export interface Request {
      // I am using auth instead of locals becuase I cannot statically type
      // locals, so to keep things statically analyzable I am using other attr
      session?: ISession;
    }
  }
}
