/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const scriptId = "razorpay-checkout-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("[Razorpay] Failed to load Razorpay Checkout script.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key?: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Initializes and opens the official Razorpay Checkout modal.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<any> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !(window as any).Razorpay) {
    throw new Error("Unable to load Razorpay Checkout SDK. Please verify your internet connection.");
  }

  const key =
    options.key ||
    import.meta.env.VITE_RAZORPAY_KEY_ID ||
    "";

  if (!key) {
    throw new Error("Razorpay Key ID is missing. Please configure VITE_RAZORPAY_KEY_ID in .env.");
  }

  const rzpOptions = {
    key,
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name || "APEX 1.0",
    description: options.description || "Hackathon Registration Fee",
    image: options.image || "/favicon.svg",
    order_id: options.order_id,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: options.theme || { color: "#dc2626" },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
        if (options.modal?.ondismiss) options.modal.ondismiss();
      },
      escape: options.modal?.escape ?? true,
      backdropclose: options.modal?.backdropclose ?? false,
    },
    handler: (response: RazorpaySuccessResponse) => {
      options.onSuccess(response);
    },
  };

  const rzpInstance = new (window as any).Razorpay(rzpOptions);

  rzpInstance.on("payment.failed", (failResponse: any) => {
    console.error("[Razorpay Payment Failed]", failResponse?.error);
    if (options.onError) {
      options.onError(failResponse?.error || new Error("Payment was rejected"));
    }
  });

  rzpInstance.open();
  return rzpInstance;
}

