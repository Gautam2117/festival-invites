export type RSVP = {
  id: string;
  inviteId: string;
  attending: boolean;
  adults: number;       // 0+ (counts mode) — default 1 if attending
  kids: number;         // 0+
  name?: string;        // optional
  contact?: string;     // optional (email/phone)
  message?: string;     // optional
  createdAt: number;
  updatedAt: number;
  ipHash?: string;
};

export type RSVPStats = {
  inviteId: string;
  yes: number;
  no: number;
  adults: number;
  kids: number;
  updatedAt: number;
};
