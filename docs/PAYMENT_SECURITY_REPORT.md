# Payment Security & Razorpay Integration Report

## Payment Parameters
- **Gateway:** Razorpay Standard Checkout
- **Currency:** INR
- **Fixed Fee:** ₹199 (19900 paise)
- **Mode:** LIVE (`rzp_live_TvchK8AZD6BwEb`)

## Cryptographic Signature Verification
When Razorpay checkout completes in the participant's browser, the client submits:
1. `razorpay_order_id`
2. `razorpay_payment_id`
3. `razorpay_signature`

The backend server reconstructs the digest:
```ts
const payload = order_id + "|" + payment_id;
const expectedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(payload)
  .digest("hex");

const isValid = crypto.timingSafeEqual(
  Buffer.from(expectedSignature, "utf8"),
  Buffer.from(signature, "utf8")
);
```
Only upon positive verification is the team marked as `paid` in Supabase.
