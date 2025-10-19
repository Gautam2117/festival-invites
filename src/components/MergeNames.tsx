"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Papa from "papaparse";
import JSZip from "jszip";
import {
  Upload,
  FileDown,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  X,
  RefreshCcw,
  FileSpreadsheet,
  Play,
} from "lucide-react";

/* ----------------------------- Types & helpers ---------------------------- */

type Row = Record<string, string>;
type QueuedItem = {
  index: number;
  name?: string;
  renderId: string;
  bucketName: string;
  functionName?: string;
  outKey?: string;
  ext: "png";
};

type Props = {
  templateSlug: string;
  baseTitle: string; // can contain {name}
  baseNames?: string; // can contain {name}
  baseDate?: string; // can contain {name}
  baseVenue?: string; // can contain {name}
  bg?: string | null;
  isWish?: boolean;
};

type Status = "idle" | "parsing" | "queued" | "polling" | "done" | "error";

/** Sleep helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate a sample CSV file on the fly */
function makeSampleCSV() {
  const rows = [
    { Name: "Aarav Gupta" },
    { Name: "Isha Sharma" },
    { Name: "Kabir Mehra" },
    { Name: "Ananya Rao" },
  ];
  const csv = Papa.unparse(rows, { header: true });
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

/** Replace {name} tokens safely */
function interpolate(template: string | undefined, name: string) {
  if (!template) return "";
  return template.replace(/\{name\}/gi, name || "");
}

/* ------------------------------ Main Component --------------------------- */

export default function MergeNames({
  templateSlug,
  baseTitle,
  baseNames,
  baseDate,
  baseVenue,
  bg,
  isWish = false,
}: Props) {
  const prefersReduced = useReducedMotion();

  const [rows, setRows] = useState<Row[]>([]);
  const [nameCol, setNameCol] = useState<string>("name");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [queued, setQueued] = useState<QueuedItem[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  const [isDragging, setDragging] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const canceledRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  const exampleName = useMemo(() => {
    if (!rows.length) return "Your Guest";
    const r = rows[0];
    return r[nameCol] || r["name"] || "Your Guest";
  }, [rows, nameCol]);

  const preview = useMemo(
    () => ({
      title: interpolate(baseTitle, exampleName),
      names: interpolate(baseNames, exampleName),
      date: interpolate(baseDate, exampleName),
      venue: interpolate(baseVenue, exampleName),
    }),
    [baseTitle, baseNames, baseDate, baseVenue, exampleName]
  );

  /* ------------------------------ CSV Parsing ---------------------------- */

  const parseCSV = useCallback((file: File) => {
    setError(null);
    setStatus("parsing");
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).map((r: any) => {
          const out: Row = {};
          Object.keys(r || {}).forEach((k) => {
            if (!k) return;
            out[k.trim().toLowerCase()] = String(r[k] ?? "").trim();
          });
          return out;
        });
        const filtered = data.filter((r) => Object.keys(r).length > 0);
        setRows(filtered);
        setStatus("idle");

        if (filtered[0]) {
          const guess =
            Object.keys(filtered[0]).find((k) => /name/i.test(k)) || "name";
          setNameCol(guess);
        }
      },
      error: (err) => {
        setError(err.message || "CSV parse failed");
        setStatus("error");
      },
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f && /\.csv$/i.test(f.name)) parseCSV(f);
      else setError("Please drop a .csv file");
    },
    [parseCSV]
  );

  /* ----------------------------- Rendering Batch ------------------------- */

  // Limit parallel polling to avoid throttling backends (tune freely)
  const CONCURRENCY = 4;

  async function pollOne(it: QueuedItem, idx: number, rowName: string) {
    // presign download
    const ext = it.ext || "png";
    const outKey = it.outKey || `renders/${it.renderId}/out.${ext}`;
    const signRes = await fetch(
      `/api/lambda/file?bucketName=${encodeURIComponent(
        it.bucketName
      )}&outKey=${encodeURIComponent(outKey)}&ext=${ext}`
    );
    const signJ = await signRes.json();
    if (!signRes.ok || !signJ?.url) throw new Error("Presign failed");

    // probe until exists or canceled
    let readyUrl: string | null = null;
    let delay = 600;
    const deadline = Date.now() + 90_000;

    while (!canceledRef.current && Date.now() < deadline) {
      const pr = await fetch(
        `/api/lambda/probe?bucketName=${encodeURIComponent(
          it.bucketName
        )}&outKey=${encodeURIComponent(outKey)}`
      ).then((x) => x.json());
      if (pr?.exists) {
        readyUrl = signJ.url as string;
        break;
      }
      await sleep(delay);
      delay = Math.min(delay * 1.35 + Math.random() * 120, 4000);
    }

    if (canceledRef.current) throw new Error("Canceled");
    if (!readyUrl) throw new Error("Timed out waiting for a file");

    const filenameSafe = (rowName || `item-${idx + 1}`)
      .replace(/[^a-z0-9_-]+/gi, "_")
      .slice(0, 40);

    return { name: `${filenameSafe}.png`, url: readyUrl };
  }

  async function startRender() {
    try {
      canceledRef.current = false;
      setStatus("queued");
      setError(null);
      setFiles([]);
      setQueued([]);
      setProgress({ done: 0, total: rows.length });

      const payload = {
        base: {
          templateSlug,
          title: baseTitle,
          names: baseNames,
          date: baseDate,
          venue: baseVenue,
          bg: bg ?? undefined,
          isWish,
          tier: "free", // keep free to match current backend entitlements
          watermark: true,
          watermarkStrategy: "ribbon+tile",
          wmSeed: Math.floor(Math.random() * 1e6),
          wmText: "Festival Invites — FREE PREVIEW",
          wmOpacity: 0.18,
        },
        rows: rows.map((r) => ({
          ...r,
          name: r[nameCol] || r["name"] || "",
        })),
      };

      const r = await fetch("/api/merge/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Queue failed");

      const items: QueuedItem[] = j.items || [];
      setQueued(items);
      setStatus("polling");

      // Concurrency pool
      const out: { name: string; url: string }[] = [];
      let done = 0;

      const work = items.map((it, i) => async () => {
        const rowName = rows[it.index]?.[nameCol] || rows[it.index]?.name || "";
        const file = await pollOne(it, i, rowName);
        out.push(file);
        done += 1;
        setProgress({ done, total: items.length });
      });

      // Runner
      const runners = new Array(Math.min(CONCURRENCY, work.length))
        .fill(0)
        .map(async () => {
          while (work.length && !canceledRef.current) {
            const fn = work.shift()!;
            try {
              await fn();
            } catch (e: any) {
              if (e?.message === "Canceled") break;
              // collect partial but show error
              setError(e?.message || "One or more renders failed");
            }
          }
        });

      await Promise.all(runners);
      if (canceledRef.current) {
        setStatus("idle");
        setShowToast("Canceled");
        setTimeout(() => setShowToast(null), 1200);
        return;
      }

      // Sort results by name for a neat list
      out.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(out);
      setStatus("done");
      setShowToast("Batch ready");
      setTimeout(() => setShowToast(null), 1500);
    } catch (e: any) {
      setError(e?.message || "Batch failed");
      setStatus("error");
    }
  }

  function cancelAll() {
    canceledRef.current = true;
  }

  async function downloadZip() {
    if (!files.length) return;
    const zip = new JSZip();
    for (const f of files) {
      const resp = await fetch(f.url);
      const blob = await resp.blob();
      zip.file(f.name, blob);
    }
    const out = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = "invites-batch.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function resetAll() {
    canceledRef.current = false;
    setStatus("idle");
    setError(null);
    setRows([]);
    setFiles([]);
    setQueued([]);
    setProgress({ done: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ------------------------------ UI Helpers ----------------------------- */

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  /* --------------------------------- UI ---------------------------------- */

  return (
    <section
      className="mt-8 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
      onClick={stop}
    >
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-grid h-9 w-9 place-items-center rounded-xl bg-ink-900/90 text-white shadow">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg">Batch (CSV) — Name merge</h3>
            <p className="text-xs text-ink-700">
              Use <code className="rounded bg-ink-50 px-1">{"{name}"}</code> in
              Title/Names/Date/Venue. Upload a CSV with a{" "}
              <strong>name</strong> column (or pick the column below).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const blob = makeSampleCSV();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-names.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 hover:bg-white"
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-900 hover:bg-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Dropzone / Uploader */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative mt-3 grid gap-3 rounded-2xl border-2 border-dashed p-4 sm:grid-cols-[1fr_auto] ${
          isDragging
            ? "border-amber-400 bg-amber-50/50"
            : "border-ink-200 bg-white/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 text-white ring-1 ring-white/60 shadow">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">
              Drag & drop your <span className="font-semibold">.csv</span> here
              or click to upload
            </div>
            <div className="text-xs text-ink-700">
              We’ll auto-detect the <em>name</em> column; you can change it.
            </div>
          </div>
        </div>

        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseCSV(f);
              }}
            />
            <FileDown className="h-4 w-4" />
            Choose file
          </label>
        </div>
      </div>

      {/* Mapping + Preview */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/60 bg-white/90 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Column mapping</div>
            {!!columns.length && (
              <div className="text-xs text-ink-600">{rows.length} rows</div>
            )}
          </div>

          {columns.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm">
                Name column:
                <select
                  className="ml-2 rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm"
                  value={nameCol}
                  onChange={(e) => setNameCol(e.target.value)}
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <span className="text-xs text-ink-600">
                Example: <span className="font-medium">{exampleName}</span>
              </span>
            </div>
          ) : (
            <p className="text-sm text-ink-700">
              Upload a CSV to pick the column that contains guest names.
            </p>
          )}

          {/* Tiny table preview */}
          {rows.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-xs">
                <thead>
                  <tr className="text-ink-600">
                    {columns.map((c) => (
                      <th key={c} className="border-b border-ink-100 py-1 pr-3">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="odd:bg-ink-50/40">
                      {columns.map((c) => (
                        <td key={c} className="py-1 pr-3 text-ink-900">
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <div className="mt-1 text-[11px] text-ink-600">
                  Showing first 5 of {rows.length}.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Token preview */}
        <div className="rounded-xl border border-white/60 bg-white/90 p-4">
          <div className="mb-2 text-sm font-medium">Token preview</div>
          <ul className="grid gap-2 text-sm">
            <li>
              <span className="inline-block w-20 text-ink-600">Title:</span>
              <span className="font-medium">{preview.title || "—"}</span>
            </li>
            {!isWish && (
              <>
                <li>
                  <span className="inline-block w-20 text-ink-600">Names:</span>
                  <span className="font-medium">{preview.names || "—"}</span>
                </li>
                <li>
                  <span className="inline-block w-20 text-ink-600">Date:</span>
                  <span className="font-medium">{preview.date || "—"}</span>
                </li>
                <li>
                  <span className="inline-block w-20 text-ink-600">Venue:</span>
                  <span className="font-medium">{preview.venue || "—"}</span>
                </li>
              </>
            )}
          </ul>

          <p className="mt-2 text-xs text-ink-700">
            Replace <code className="rounded bg-ink-50 px-1">{"{name}"}</code>{" "}
            in your fields to personalize each render.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={startRender}
          disabled={
            !rows.length ||
            status === "parsing" ||
            status === "queued" ||
            status === "polling"
          }
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-60"
          title="Start batch render"
        >
          {status === "queued" || status === "polling" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Rendering…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Start render
            </>
          )}
        </button>

        {(status === "queued" || status === "polling") && (
          <button
            type="button"
            onClick={cancelAll}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60"
            title="Cancel"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}

        {files.length > 0 && (
          <button
            type="button"
            onClick={downloadZip}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50/60"
            title="Download all as ZIP"
          >
            <FileDown className="h-4 w-4" />
            Download ZIP
          </button>
        )}
      </div>

      {/* Progress */}
      {(status === "queued" || status === "polling") && (
        <div className="mt-3 rounded-xl border border-ink-100 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-700">
            <span className="inline-flex items-center gap-2">
              <Play className="h-3.5 w-3.5" />
              Processing…
            </span>
            <span>
              {progress.done} / {progress.total} ({progressPct}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
            />
          </div>
          <div className="mt-2 text-xs text-ink-600">
            You can keep editing while this completes.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Results grid */}
      {files.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-display text-base">Results</h4>
            <div className="text-xs text-ink-700">
              {files.length} image{files.length > 1 ? "s" : ""}
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((f) => (
              <li
                key={f.url}
                className="rounded-xl border border-white/60 bg-white/90 p-2 shadow-sm"
              >
                <div className="mb-1 truncate text-[11px] text-ink-700">
                  {f.name}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.name}
                  className="h-auto w-full rounded-lg"
                  draggable={false}
                />
                <div className="mt-2 flex items-center justify-between">
                  <a
                    href={f.url}
                    download={f.name}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tiny toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 text-xs text-ink-900 shadow backdrop-blur"
            role="status"
            aria-live="polite"
          >
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
