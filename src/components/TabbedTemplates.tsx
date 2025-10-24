// src/components/TabbedTemplates.tsx
"use client";

import { useState } from "react";
import TemplateGrid from "@/components/TemplateGrid";

export default function TabbedTemplates() {
  const [tab, setTab] = useState<"invite" | "wish">("invite");

  const baseBtn =
    "px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none";
  const active =
    "bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-600 text-white shadow-lg";
  const inactive =
    "bg-white/90 border border-gray-300 text-gray-800 hover:bg-white";

  return (
    <section
      id="templates"
      aria-label="Browse templates"
      style={{ containIntrinsicSize: "1200px 1200px" }}
      className="relative mx-auto max-w-6xl px-4 pb-20"
    >
      {/* tab bar */}
      <div className="mb-6 flex justify-center gap-3">
        <button
          className={`${baseBtn} ${tab === "invite" ? active : inactive}`}
          onClick={() => setTab("invite")}
        >
          Festivals
        </button>
        <button
          className={`${baseBtn} ${tab === "wish" ? active : inactive}`}
          onClick={() => setTab("wish")}
        >
          Daily&nbsp;Wishes
        </button>
      </div>

      {/* grid */}
      <TemplateGrid kindFilter={tab} />
    </section>
  );
}
