import {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailure as postPaymentFailure,
} from '../api/buyerApi'

// Razorpay's checkout is loaded from its CDN on first use and then reused.
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise = null

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => {
      scriptPromise = null
      reject(
        new Error('We could not open the payment window. Check your connection and try again.')
      )
    }
    document.body.appendChild(script)
  })
  return scriptPromise
}

// Opens Razorpay's modal and settles when the shopper either completes the
// payment (resolves with Razorpay's response) or leaves it (rejects with
// code PAYMENT_DISMISSED / PAYMENT_FAILED). The caller must still ask the
// server to verify the signature - nothing here is trusted on its own.
export async function openRazorpayCheckout({
  keyId,
  amount,
  currency,
  razorpayOrderId,
  description,
  prefill = {},
}) {
  const Razorpay = await loadRazorpay()
  if (!Razorpay) {
    throw new Error('We could not open the payment window. Please try cash on delivery.')
  }

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: 'WeaveConnect',
      description,
      prefill,
      theme: { color: '#d4af37' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () =>
          reject(
            Object.assign(new Error('Payment was cancelled.'), { code: 'PAYMENT_DISMISSED' })
          ),
      },
    })

    rzp.on('payment.failed', (response) =>
      reject(
        Object.assign(
          new Error(
            response?.error?.description || 'The payment did not go through. Please try again.'
          ),
          { code: 'PAYMENT_FAILED' }
        )
      )
    )

    rzp.open()
  })
}

/**
 * Full online-payment flow for one order.
 *
 *   payOnline({ items, shippingAddress })  fresh checkout from the cart
 *   payOnline({ orderId })                 retry an order created earlier
 *
 * Creates (or reuses) the server-side payment order, opens Razorpay, then
 * sends the signed response back for server verification. Resolves with the
 * verified order, rejects with the original error otherwise.
 *
 * `onOrderCreated(orderId)` fires as soon as the order exists - before the
 * payment window opens - so the caller can remember it even if the shopper
 * walks away from the modal.
 */
export async function payOnline({
  items,
  shippingAddress,
  orderId,
  buyer,
  onOrderCreated,
}) {
  const created = await createPaymentOrder(
    orderId ? { orderId } : { items, shippingAddress }
  )
  const payload = created?.data || {}
  onOrderCreated?.(payload.orderId)

  const prefill = {
    name: buyer?.name || undefined,
    email: buyer?.email || undefined,
    contact: buyer?.phone || shippingAddress?.phone || undefined,
  }

  const response = await openRazorpayCheckout({
    keyId: payload.keyId,
    amount: payload.amount,
    currency: payload.currency,
    razorpayOrderId: payload.razorpayOrderId,
    description: `Order ${String(payload.orderId).slice(-8).toUpperCase()}`,
    prefill,
  }).catch((err) => {
    // Whatever went wrong, the caller needs to know WHICH order is waiting
    // so it can retry that one instead of creating another.
    if (err && typeof err === 'object') err.orderId = payload.orderId
    throw err
  })

  try {
    const verified = await verifyPayment({
      orderId: payload.orderId,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
    })
    return verified?.data?.order || payload.order
  } catch (err) {
    if (err && typeof err === 'object') err.orderId = payload.orderId
    throw err
  }
}

// Tells the server the attempt did not complete so the order is marked
// "failed" instead of silently staying pending. Failures here are never
// fatal: the shopper may simply try again.
export async function reportPaymentFailure(orderId) {
  try {
    await postPaymentFailure(orderId)
  } catch {
    // Nothing to recover - the order simply stays unpaid.
  }
}
