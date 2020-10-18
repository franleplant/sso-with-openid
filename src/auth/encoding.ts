export function fromBase64<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
}

export function toBase64<T>(data: T): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}
