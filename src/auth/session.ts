import { TokenSet, UserinfoResponse } from "openid-client";

export interface ISession {
  user: UserinfoResponse;
  tokenSet: TokenSet;
}

export function serialize(session: ISession): string {
  return JSON.stringify(session);
}

export function deserialize(value: string): ISession {
  const raw = JSON.parse(value);
  return {
    ...raw,
    tokenSet: new TokenSet(raw.tokenSet),
  };
}
