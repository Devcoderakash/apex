import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStandardOrder, verifyStandardPayment } from "@/lib/api";
import { openRazorpayCheckout, type RazorpaySuccessResponse } from "@/lib/razorpay";

export interface RazorpayCheckoutButtonProps {
  amountInPaise?: number; // Minimum 100 paise (₹1.00)
  currency?: string;
  name?: string;
  description?: string;
  receipt?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onPaymentSuccess?: (res: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => void;
  onPaymentError?: (err: any) => void;
  className?: string;
  buttonText?: string;
}

export function RazorpayCheckoutButton({
  amountInPaise = 19900, // Default ₹199
  currency = "INR",
  name = "APEX 1.0",
  description = "Hackathon Registration Fee",
  receipt,
  prefill,
  notes,
  onPaymentSuccess,
  onPaymentError,
  className,
  buttonText = "PAY WITH RAZORPAY",
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      toast.loading("Creating payment order...", { id: "rzp_init" });

      // 1. Call Backend to create Razorpay Order
      const order = await createStandardOrder({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      });

      toast.dismiss("rzp_init");
      toast.loading("Opening Razorpay Checkout modal...", { id: "rzp_modal" });

      // 2. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name,
        description,
        prefill,
        notes,
        onDismiss: () => {
          toast.dismiss("rzp_modal");
          toast.info("PAYMENT CANCELLED", {
            description: "You closed the checkout modal. You can retry at any time.",
          });
          setLoading(false);
        },
        onError: (err) => {
          toast.dismiss("rzp_modal");
          const errorDesc = err?.description || err?.message || "Payment was rejected by bank.";
          toast.error("PAYMENT FAILED", { description: errorDesc });
          setLoading(false);
          if (onPaymentError) onPaymentError(err);
        },
        onSuccess: async (response: RazorpaySuccessResponse) => {
          toast.dismiss("rzp_modal");
          toast.loading("Verifying payment signature with server...", { id: "rzp_verify" });

          try {
            // 3. Send all three parameters to backend verify endpoint
            const verifyResult = await verifyStandardPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              toast.success("PAYMENT VERIFIED", {
                id: "rzp_verify",
                description: `Payment ID: ${response.razorpay_payment_id}`,
              });

              if (onPaymentSuccess) {
                onPaymentSuccess({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
              }
            } else {
              toast.error("VERIFICATION FAILED", {
                id: "rzp_verify",
                description: "Signature mismatch detected. Payment could not be confirmed.",
              });
            }
          } catch (verifyErr: any) {
            toast.error("VERIFICATION ERROR", {
              id: "rzp_verify",
              description: verifyErr.message || "Failed to communicate with verification server.",
            });
            if (onPaymentError) onPaymentError(verifyErr);
          } finally {
            setLoading(false);
          }
        },
      });

      toast.dismiss("rzp_modal");
    } catch (err: any) {
      toast.dismiss("rzp_init");
      toast.dismiss("rzp_modal");
      toast.error("CHECKOUT FAILED", {
        description: err.message || "Failed to initialize checkout. Please try again.",
      });
      setLoading(false);
      if (onPaymentError) onPaymentError(err);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={className || "font-mono tracking-wider glow-primary"}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>INITIALIZING…</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{buttonText}</span>
        </span>
      )}
    </Button>
  );
}
