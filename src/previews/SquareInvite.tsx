// src/previews/SquareInvite.tsx
type Props = {
  title: string;
  names: string;
  date: string;
  venue?: string;
  /** e.g. "from-amber-400 via-orange-400 to-rose-500" */
  accent?: string;
};

export default function SquareInvite({
  title,
  names,
  date,
  venue,
  accent = "from-amber-400 via-orange-400 to-rose-500",
}: Props) {
  return (
    <div
      className={`relative w-full rounded-[24px] p-[2px] bg-gradient-to-br ${accent}`}
      style={{ aspectRatio: 1 }}
      aria-label="Festival invite preview"
    >
      {/* Card */}
      <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-white/80 backdrop-blur-sm ring-1 ring-black/5">
        {/* Accent wash behind content */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${accent} opacity-20`} />

        {/* Radial glows */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full blur-3xl
                        bg-[radial-gradient(ellipse_at_center,_rgba(255,200,120,0.35),_transparent_60%)]" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[18rem] w-[18rem] rounded-full blur-3xl
                        bg-[radial-gradient(ellipse_at_center,_rgba(255,77,141,0.25),_transparent_60%)]" />

        {/* Subtle festive dot texture */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" role="img">
          <defs>
            <pattern id="sq-dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="currentColor" />
            </pattern>
            <filter id="sq-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <radialGradient id="sq-star" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
              gradientTransform="translate(10 10) rotate(90) scale(8 8)">
              <stop stopColor="#FFD166" />
              <stop offset="1" stopColor="#FF4D8D" stopOpacity="0.7" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#sq-dots)" className="text-ink-500/10" />
          {/* a few glowy starlets */}
          <g filter="url(#sq-glow)">
            <path d="M20 18l1.4 3.2l3.2 1.4l-3.2 1.4L20 27.2l-1.4-3.2l-3.2-1.4l3.2-1.4L20 18Z" fill="url(#sq-star)" />
            <path d="M85 64l1 2.4l2.4 1l-2.4 1L85 70.8l-1-2.4l-2.4-1l2.4-1L85 64Z" fill="url(#sq-star)" />
            <path d="M220 120l1.2 2.8l2.8 1.2l-2.8 1.2L220 128.8l-1.2-2.8l-2.8-1.2l2.8-1.2L220 120Z" fill="url(#sq-star)" />
          </g>
        </svg>

        {/* Soft vignette for premium depth */}
        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-black/5" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.18),_transparent_55%)] mix-blend-multiply opacity-20" />

        {/* Gentle diagonal sheen (no heavy animation) */}
        <div
          className="pointer-events-none absolute -left-1/3 top-1/4 h-2/3 w-1/2 -rotate-12 opacity-20"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {/* Top badge */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-medium text-ink-700 shadow-sm backdrop-blur">
            Festival Invite
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Ready for WhatsApp
          </div>

          {/* Title */}
          <h2
            className="font-display max-w-[85%] text-[clamp(22px,6vw,40px)] leading-tight tracking-tight text-ink-900
                       drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
          >
            {title}
          </h2>

          {/* Names pill with gradient hairline */}
          <div className={`mt-3 inline-flex rounded-full bg-gradient-to-r ${accent} p-[1px]`}>
            <div className="rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-ink-800 backdrop-blur">
              {names}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-4 h-px w-36 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-ink-300/70 to-transparent" />

          {/* Date / Venue */}
          <div className="mt-3 space-y-1 text-[0.92rem] text-ink-800">
            <p className="inline-flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-75">
                <path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v1h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm14 7H3v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9ZM5 13h6v6H5v-6Z"/>
              </svg>
              {date}
            </p>
            {venue ? (
              <p className="inline-flex items-center justify-center gap-2 text-ink-700">
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-75">
                  <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5Z"/>
                </svg>
                {venue}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
