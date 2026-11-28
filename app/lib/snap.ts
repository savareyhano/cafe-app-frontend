import { MIDTRANS_CLIENT_KEY, MIDTRANS_PRODUCTION } from "~/lib/config";

type SnapCallbacks = {
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
  onClose: () => void;
};
type Snap = { pay: (token: string, callbacks: SnapCallbacks) => void };

declare global {
  interface Window {
    snap?: Snap;
  }
}

const SNAP_JS = MIDTRANS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

let loading: Promise<Snap> | null = null;

function loadSnap(): Promise<Snap> {
  if (window.snap) return Promise.resolve(window.snap);
  if (!MIDTRANS_CLIENT_KEY) return Promise.reject(new Error("No Midtrans client key"));
  loading ??= new Promise<Snap>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SNAP_JS;
    script.dataset.clientKey = MIDTRANS_CLIENT_KEY;
    script.onload = () => (window.snap ? resolve(window.snap) : reject(new Error("snap.js loaded without snap")));
    script.onerror = () => {
      loading = null; // let the next payment try again
      script.remove();
      reject(new Error("snap.js failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * A closing dialog or sheet keeps `pointer-events: none` on <body> until its exit animation ends.
 * Snap's iframe lives in <body>, so opening it before then leaves it unclickable. Waits up to 1 s.
 */
async function pageUnlocked() {
  for (let i = 0; i < 20 && document.body.style.pointerEvents === "none"; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
}

const RETURN_KEY = "pay-return";

/**
 * Where to send the customer back to after paying on Midtrans's own page. Midtrans adds its
 * payment id to the finish URL, and for a split part that id isn't an order id.
 */
export const payReturn = {
  take: () => {
    try {
      const to = sessionStorage.getItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
      return to;
    } catch {
      return null;
    }
  },
  set: (path: string) => {
    try {
      sessionStorage.setItem(RETURN_KEY, path);
    } catch {
      // Private mode: the finish page still works for whole orders
    }
  },
};

/**
 * Opens Midtrans Snap over the current page and resolves when the customer is done with it.
 * The result only tells the page to refresh; the payment webhook is what marks anything paid.
 * If snap.js can't load (no client key, blocked, offline), it falls back to Midtrans's own page
 * and resolves "redirected"; `returnTo` is where the customer comes back to.
 */
export async function openSnap(
  token: string | null,
  redirectUrl: string | null,
  returnTo: string,
): Promise<"success" | "pending" | "error" | "closed" | "redirected"> {
  try {
    if (!token) throw new Error("No Snap token");
    const snap = await loadSnap();
    await pageUnlocked();
    return await new Promise((resolve) => {
      try {
        snap.pay(token, {
          onSuccess: () => resolve("success"),
          onPending: () => resolve("pending"),
          onError: () => resolve("error"),
          onClose: () => resolve("closed"),
        });
      } catch {
        resolve("error"); // e.g. a popup is already open
      }
    });
  } catch {
    if (!redirectUrl) throw new Error("Pembayaran online belum bisa dibuka. Coba lagi sebentar lagi.");
    payReturn.set(returnTo);
    window.location.assign(redirectUrl);
    return "redirected";
  }
}
