// src/types/global.d.ts
export {};

declare global {
  interface Window {
    Razorpay: any; // relax typing for the checkout constructor
  }
}
