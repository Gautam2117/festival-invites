// 🔄  src/hooks/useQueryParam.ts   (create or replace)

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * React-state wrapper around a single query-string key that
 * stays in sync for **all** kinds of navigation:
 *  • back / forward  →  popstate
 *  • <Link> clicks   →  routeChangeComplete
 */
export default function useQueryParam(name: string) {
  const router = useRouter();

  // helper to read the current value
  const read = () =>
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get(name) || "";

  const [val, setVal] = useState<string>(read);

  useEffect(() => {
    const update = () => setVal(read());

    // 1) browser back / forward
    window.addEventListener("popstate", update);

    // 2) in-app route changes (<Link>, router.push, etc.)
    router.events.on("routeChangeComplete", update);

    // cleanup
    return () => {
      window.removeEventListener("popstate", update);
      router.events.off("routeChangeComplete", update);
    };
  }, [name, router.events]);

  return val;
}
