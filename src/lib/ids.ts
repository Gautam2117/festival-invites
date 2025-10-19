export function shortId(len = 8) {
  const dict = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; // no 0/O/I/l
  let out = "";

  const g = globalThis as any;
  if (g.crypto?.getRandomValues) {
    const bytes = new Uint8Array(len);
    g.crypto.getRandomValues(bytes);
    for (const b of bytes) out += dict[b % dict.length];
    return out;
  }

  // Fallback
  for (let i = 0; i < len; i++) out += dict[Math.floor(Math.random() * dict.length)];
  return out;
}
