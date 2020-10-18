import { generators } from "openid-client";
import { fromBase64, toBase64 } from "./encoding";

export interface IState {
  backToPath: string;
  bytes: string;
}

export function serializeAuthState(state: Partial<IState>): string {
  // probably you would base64 encode this
  return toBase64({
    ...state,
    bytes: generators.state(),
  });
}

export function deserializeAuthState(value: string): IState {
  return fromBase64(value);
}
