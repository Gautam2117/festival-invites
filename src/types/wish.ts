export type Wish = {
  id: string;                // doc id
  inviteId: string;          // which invite
  message: string;           // <= 240 chars
  senderName?: string;       // <= 60
  senderType: "company" | "family" | "personal";
  logoUrl?: string | null;   // optional company logo
  theme?: string;            // optional styling token
  approved: boolean;         // moderation gate
  createdAt: number;         // epoch ms
  ipHash?: string;           // hashed ip (best-effort)
};
