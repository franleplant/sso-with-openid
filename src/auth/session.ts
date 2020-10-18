import { TokenSet, UserinfoResponse } from "openid-client";
import { fromBase64, toBase64 } from "./encoding";

export interface ISession {
  user: UserinfoResponse;
  tokenSet: TokenSet;
}

export function serialize(session: ISession): string {
  return toBase64(session);
}

export function deserialize(value: string): ISession {
  const raw = fromBase64<any>(value);
  return {
    ...raw,
    tokenSet: new TokenSet(raw.tokenSet),
  };
}
