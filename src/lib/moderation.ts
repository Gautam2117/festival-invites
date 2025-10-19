const BAD_WORDS = ["fuck","shit","bitch","asshole","cunt","dick","slut","chutiya","madarchod","bhosdi","randi","lund","harami"];
export function needsReview(text: string) {
  const t = (text || "").toLowerCase();
  return BAD_WORDS.some(w => t.includes(w));
}
export function clamp(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) : s;
}
export function hashIP(ip: string) {
  // dumb stable hash to throttle per ip+invite
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
