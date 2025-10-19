export {};

declare global {
  interface Window {
    // Keep it optional so it doesn't clash if another file declares it as optional.
    // If you *already* have a declaration elsewhere, delete that and keep only this one.
    Razorpay?: new (options: any) => {
      open: () => void;
      on?: (event: string, cb: (payload: any) => void) => void;
    };
  }
}
