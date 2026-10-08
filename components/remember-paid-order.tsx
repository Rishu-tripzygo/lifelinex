"use client";

import { useEffect } from "react";
import { PAID_ORDER_STORAGE_KEY } from "@/lib/lead";

// Lets the PCOS page offer "pick your time" again if the customer closes the return page.
// Stores only the order id; the server re-checks it before showing anything.
export function RememberPaidOrder({ orderId }: { orderId: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(PAID_ORDER_STORAGE_KEY, orderId);
    } catch {
      // Storage can be blocked (private mode); the return page still works.
    }
  }, [orderId]);
  return null;
}
