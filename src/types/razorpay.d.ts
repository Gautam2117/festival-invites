// src/types/razorpay.d.ts
export {};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      close?: () => void;
      on?: (event: string, cb: (payload: any) => void) => void;
    };
  }

  type RazorpayOptions = {
    key: string;
    amount: number;            // in paise
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    handler?: (res: RazorpaySuccess) => void;
    theme?: { color?: string };
  };

  type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };
}
