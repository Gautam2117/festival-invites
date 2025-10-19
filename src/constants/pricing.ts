export type PlanId = "free" | "image_hd" | "video_hd" | "brand_kit" | "season_pass";

export const PLANS: Record<Exclude<PlanId, "free">, { label: string; amount: number; currency: "INR"; desc: string }> = {
  image_hd:  { label: "HD Image",  amount: 29_00,  currency: "INR", desc: "1080p no watermark" },
  video_hd:  { label: "HD Video",  amount: 79_00,  currency: "INR", desc: "1080x1920 no watermark" },
  brand_kit: { label: "Brand Kit", amount: 149_00, currency: "INR", desc: "Logo + colors + end card" },
  season_pass:{ label: "Season Pass", amount: 199_00, currency: "INR", desc: "Unlimited HD images + 20 videos" },
};

export const FEATURES = {
  free:       { watermark: true,  imageHD: false, videoHD: false, wishesCap: 20, brandKit: false },
  image_hd:   { watermark: false, imageHD: true,  videoHD: false, wishesCap: 50, brandKit: false },
  video_hd:   { watermark: false, imageHD: true,  videoHD: true,  wishesCap: 200, brandKit: false },
  brand_kit:  { watermark: false, imageHD: true,  videoHD: true,  wishesCap: 200, brandKit: true },
  season_pass:{ watermark: false, imageHD: true,  videoHD: true,  wishesCap: 500, brandKit: true },
} as const;
