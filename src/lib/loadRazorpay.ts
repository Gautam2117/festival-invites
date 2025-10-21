let razorpayPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve(); // SSR no-op
  if ((window as any).Razorpay) return Promise.resolve();       // already loaded
  if (razorpayPromise) return razorpayPromise;                  // in-flight

  razorpayPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.head.appendChild(s);
  });

  return razorpayPromise;
}
