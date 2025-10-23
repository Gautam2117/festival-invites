// src/components/MergeNames.tsx
"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useId,
} from "react";
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

const CONCURRENCY = 4;

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
  const dropDescId = useId();

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
  const [zipPct, setZipPct] = useState<number>(0);

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

  const parseCSVText = useCallback((text: string) => {
    setError(null);
    setStatus("parsing");
    Papa.parse<Row>(text, {
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
          setNameCol((prev) => prev || guess);
          // persist choice per template for convenience
          try {
            localStorage.setItem(
              `fi:merge:${templateSlug}:nameCol`,
              guess.toLowerCase()
            );
          } catch {}
        } else {
          setError("No rows detected in CSV.");
        }
      },
      error: (err: { message: any; }) => {
        setError(err.message || "CSV parse failed");
        setStatus("error");
      },
    });
  }, [templateSlug]);

  const parseCSV = useCallback(
    (file: File) => {
      setError(null);
      setStatus("parsing");

      // Guard: surprisingly large files
      if (file.size > 8 * 1024 * 1024) {
        setError("CSV is too large (max ~8MB). Split your list and retry.");
        setStatus("error");
        return;
      }

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
            setNameCol((prev) => prev || guess);
            try {
              localStorage.setItem(
                `fi:merge:${templateSlug}:nameCol`,
                guess.toLowerCase()
              );
            } catch {}
          } else {
            setError("No rows detected in CSV.");
          }
        },
        error: (err) => {
          setError(err.message || "CSV parse failed");
          setStatus("error");
        },
      });
    },
    [templateSlug]
  );

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

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const txt = e.clipboardData?.getData("text");
      if (!txt) return;
      // Heuristic: looks like CSV if it has commas/newlines and a header-ish first line
      if (/,/.test(txt) && /\n/.test(txt)) {
        e.preventDefault();
        parseCSVText(txt);
        setShowToast("CSV pasted");
        setTimeout(() => setShowToast(null), 1000);
      }
    },
    [parseCSVText]
  );

  // hydrate nameCol from memory (per template)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`fi:merge:${templateSlug}:nameCol`);
      if (saved) setNameCol(saved);
    } catch {}
  }, [templateSlug]);

  /* ----------------------------- Rendering Batch ------------------------- */

  async function pollOne(it: QueuedItem, idx: number, rowName: string) {
    // --- Out key handling: no 'renders/' prefix by default ---
    const ext = it.ext || "png";
    const outKey = it.outKey || `${it.renderId}/out.${ext}`;

    // presign download
    const signRes = await fetch(
      `/api/lambda/file?bucketName=${encodeURIComponent(
        it.bucketName
      )}&outKey=${encodeURIComponent(outKey)}&ext=${ext}`,
      { cache: "no-store" }
    );
    const signJ = await signRes.json();
    if (!signRes.ok || !signJ?.url) throw new Error("Presign failed");

    // probe until exists or canceled
    let readyUrl: string | null = null;
    let delay = 650;
    const deadline = Date.now() + 120_000;

    while (!canceledRef.current && Date.now() < deadline) {
      const pr = await fetch(
        `/api/lambda/probe?bucketName=${encodeURIComponent(
          it.bucketName
        )}&outKey=${encodeURIComponent(outKey)}`,
        { cache: "no-store" }
      ).then((x) => x.json());
      if (pr?.exists) {
        readyUrl = signJ.url as string;
        break;
      }
      await sleep(delay);
      delay = Math.min(delay * 1.35 + Math.random() * 120, 4500);
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
      if (!rows.length) return;
      canceledRef.current = false;
      setStatus("queued");
      setError(null);
      setFiles([]);
      setQueued([]);
      setZipPct(0);
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
          tier: "free",
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
        cache: "no-store",
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
              setError((prev) =>
                prev
                  ? prev
                  : (e?.message as string) || "One or more renders failed"
              );
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
    setZipPct(1);
    const zip = new JSZip();
    let i = 0;
    for (const f of files) {
      const resp = await fetch(f.url, { cache: "no-store" });
      const blob = await resp.blob();
      zip.file(f.name, blob);
      i += 1;
      setZipPct(Math.round((i / files.length) * 98)); // keep a little headroom for compression
    }
    const out = await zip.generateAsync(
      { type: "blob" },
      (meta) => setZipPct(98 + Math.floor(meta.percent / 50)) // gently goes 98→100
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = "invites-batch.zip";
    a.click();
    URL.revokeObjectURL(a.href);
    setZipPct(100);
    setTimeout(() => setZipPct(0), 800);
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
      className="mt-8 rounded-2xl border border-white/60 bg-white/85 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)] supports-[backdrop-filter]:backdrop-blur-2xl"
      onClick={stop}
      aria-busy={status === "parsing" || status === "queued" || status === "polling"}
      style={{ contentVisibility: "auto" }}
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
              Use{" "}
              <code className="rounded bg-ink-50 px-1">
                {"{name}"}
              </code>{" "}
              in Title/Names/Date/Venue. Upload a CSV with a <strong>name</strong>{" "}
              column (or pick it below).
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
        role="group"
        aria-describedby={dropDescId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => fileRef.current?.click()}
        className={`relative mt-3 grid gap-3 rounded-2xl border-2 border-dashed p-4 sm:grid-cols-[1fr_auto] cursor-pointer transition ${
          isDragging
            ? "border-amber-400 bg-amber-50/50"
            : "border-ink-200 bg-white/70 hover:bg-white"
        }`}
        title="Click to choose a CSV, or drag & drop, or paste CSV text"
      >
        <div className="flex items-center gap-3">
          <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 text-white ring-1 ring-white/60 shadow">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">
              Drop your <span className="font-semibold">.csv</span> here,{" "}
              click to upload, or <span className="font-semibold">paste</span> CSV
            </div>
            <div id={dropDescId} className="text-xs text-ink-700">
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
        <div
          className="rounded-xl border border-white/60 bg-white/90 p-4 supports-[backdrop-filter]:backdrop-blur"
          style={{ contentVisibility: "auto", containIntrinsicSize: "500px 240px" }}
        >
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setNameCol(val);
                    try {
                      localStorage.setItem(
                        `fi:merge:${templateSlug}:nameCol`,
                        val.toLowerCase()
                      );
                    } catch {}
                  }}
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
        <div
          className="rounded-xl border border-white/60 bg-white/90 p-4 supports-[backdrop-filter]:backdrop-blur"
          style={{ contentVisibility: "auto", containIntrinsicSize: "500px 220px" }}
        >
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
            Replace{" "}
            <code className="rounded bg-ink-50 px-1">
              {"{name}"}
            </code>{" "}
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
        <div
          className="mt-3 rounded-xl border border-ink-100 bg-white p-3"
          role="status"
          aria-live="polite"
        >
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

      {/* ZIP progress */}
      {zipPct > 0 && (
        <div className="mt-3 rounded-xl border border-ink-100 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-ink-700">
            <span className="inline-flex items-center gap-2">
              <FileDown className="h-3.5 w-3.5" />
              Preparing ZIP…
            </span>
            <span>{zipPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full bg-ink-800"
              initial={{ width: 0 }}
              animate={{ width: `${zipPct}%` }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Results grid */}
      {files.length > 0 && (
        <div
          className="mt-5"
          style={{ contentVisibility: "auto", containIntrinsicSize: "900px 800px" }}
        >
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
                className="rounded-xl border border-white/60 bg-white/90 p-2 shadow-sm supports-[backdrop-filter]:backdrop-blur"
                style={{ contentVisibility: "auto", containIntrinsicSize: "300px 360px" }}
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
                  loading="lazy"
                  decoding="async"
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
            className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 text-xs text-ink-900 shadow supports-[backdrop-filter]:backdrop-blur"
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
