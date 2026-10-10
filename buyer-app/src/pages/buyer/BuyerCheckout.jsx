import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useBuyer } from '../../context/BuyerContext'
import { useAuth } from '../../context/AuthContext'
import { createMyOrder } from '../../api/buyerApi'
import { payOnline, reportPaymentFailure } from '../../utils/razorpay'
import { formatINR } from '../../utils/format'
import { productImage, productLink } from '../../utils/product'
import { IconAlert, IconArrowRight, IconBag } from '../../components/ui/Icons'
import { EmptyState } from '../../components/ui/States'
import { SkeletonList } from '../../components/ui/Skeleton'
import './BuyerCheckout.css'

const EMPTY_FORM = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
}

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Full name', placeholder: 'Who should receive the parcel' },
  { key: 'phone', label: 'Phone number', placeholder: 'For delivery updates', type: 'tel' },
  { key: 'addressLine1', label: 'Address line 1', placeholder: 'House number, street, area' },
  { key: 'addressLine2', label: 'Address line 2', placeholder: 'Landmark, building (optional)', optional: true },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'zip', label: 'PIN code', placeholder: '6 digits', type: 'text' },
]

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Full name is required.'
  else if (form.name.trim().length < 3) errors.name = 'Please enter the full name.'

  // The order is settled by hand at the door, so a reachable number matters.
  if (!form.phone.trim()) errors.phone = 'Phone number is required.'
  else if (!/^[0-9+\-\s()]{10,15}$/.test(form.phone.trim())) {
    errors.phone = 'Enter a valid phone number (10–15 digits).'
  }

  if (!form.addressLine1.trim()) errors.addressLine1 = 'Address is required.'

  if (!form.city.trim()) errors.city = 'City is required.'
  if (!form.state.trim()) errors.state = 'State is required.'

  // The backend rejects anything that is not exactly six digits, so we match
  // that rule here instead of letting the request fail.
  if (!form.zip.trim()) errors.zip = 'PIN code is required.'
  else if (!/^\d{6}$/.test(form.zip.trim())) errors.zip = 'PIN code must be 6 digits.'

  return errors
}

export default function BuyerCheckout() {
  const navigate = useNavigate()
  const { items, loading, clearCart } = useCart()
  const { refresh } = useBuyer()
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [method, setMethod] = useState('cod')
  // Set once an online order exists server-side, so a dismissed or failed
  // payment window retries the SAME order instead of reserving stock twice.
  const [pendingOrderId, setPendingOrderId] = useState(null)

  const lines = useMemo(
    () =>
      items.map((item, index) => ({
        key: item?._id || item?.product?._id || `item-${index}`,
        product: item?.product,
        name: item?.product?.name || 'Saree',
        price: Number(item?.product?.price) || 0,
        quantity: Number(item?.quantity) || 1,
        lineTotal: (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 1),
      })),
    [items]
  )

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const unitCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  const update = (key) => (e) => {
    const raw = e.target.value
    // Keep the field numeric for the PIN so the backend's 6-digit rule can
    // never be broken by a stray character.
    const value = key === 'zip' ? raw.replace(/\D/g, '').slice(0, 6) : raw
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please correct the highlighted fields and try again.')
      return
    }
    if (placing) return

    setPlacing(true)

    const payload = lines.map((line) => ({
      productId: line.product?._id,
      quantity: line.quantity,
    }))

    // Shipping fields are exactly what the Order model stores; addressLine2
    // is dropped when it is blank so we do not persist an empty string.
    const shippingAddress = Object.fromEntries(
      Object.entries({
        name: form.name.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
      }).filter(([, value]) => value !== '')
    )

    // ---- Cash on delivery -------------------------------------------------
    if (method === 'cod') {
      try {
        const res = await createMyOrder(payload, shippingAddress)
        const orderId = res?.data?.order?._id

        // The server empties the cart when it creates the order, so we only
        // mirror that locally - no follow-up delete calls.
        clearCart()
        await refresh()
        navigate(orderId ? `/buyer/orders?placed=${orderId}` : '/buyer/orders?placed=true', {
          replace: true,
        })
      } catch (err) {
        setFormError(err?.message || 'We could not place your order. Please try again.')
        setPlacing(false)
      }
      return
    }

    // ---- Online payment (Razorpay) ---------------------------------------
    try {
      const order = await payOnline({
        items: payload,
        shippingAddress,
        orderId: pendingOrderId,
        buyer: user,
        onOrderCreated: setPendingOrderId,
      })

      // Payment verified by the server: the order is paid, so the cart goes.
      clearCart()
      await refresh()
      navigate(
        order?._id ? `/buyer/orders?placed=${order._id}&paid=1` : '/buyer/orders?placed=true&paid=1',
        { replace: true }
      )
    } catch (err) {
      const interrupted = err?.code === 'PAYMENT_DISMISSED' || err?.code === 'PAYMENT_FAILED'
      const failedOrderId = err?.orderId || pendingOrderId

      if (interrupted && failedOrderId) {
        // The order exists server-side (stock reserved, cart emptied there),
        // it simply was not paid. Record that and let the next click reuse
        // the same order instead of creating a second one.
        setPendingOrderId(failedOrderId)
        await reportPaymentFailure(failedOrderId)
        setFormError(
          'Your payment was not completed. Your order is saved - press "Retry payment" to try again, or cancel it from your orders page.'
        )
      } else if (interrupted) {
        setFormError(err?.message || 'Your payment was not completed. Please try again.')
      } else {
        setFormError(err?.message || 'We could not start the payment. Please try again.')
      }
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <SkeletonList rows={2} />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="checkout-page">
        <EmptyState
          icon={<IconBag size={30} />}
          title="Nothing to check out"
          message="Your cart is empty, so there is nothing to order yet."
          action={{ label: 'Browse Collection', to: '/products' }}
        />
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div>
          <h1>Checkout</h1>
          <p className="checkout-sub">
            {unitCount} {unitCount === 1 ? 'saree' : 'sarees'} ·{' '}
            {method === 'razorpay' ? 'pay online' : 'cash on delivery'}
          </p>
        </div>
        <Link to="/buyer/cart" className="checkout-back">Back to cart</Link>
      </header>

      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-main">
          <section className="checkout-card" aria-labelledby="address-heading">
            <h2 id="address-heading">Delivery address</h2>
            <p className="checkout-card-sub">
              This is the address that will be stored on the order for the manufacturer.
            </p>

            {formError && (
              <div className="checkout-alert" role="alert">
                <IconAlert size={16} />
                {formError}
              </div>
            )}

            <div className="checkout-fields">
              {REQUIRED_FIELDS.map((field) => {
                const id = `checkout-${field.key}`
                const invalid = !!errors[field.key]
                return (
                  <div
                    key={field.key}
                    className={`checkout-field${field.key === 'addressLine2' ? ' checkout-field-wide' : ''}`}
                  >
                    <label htmlFor={id}>
                      {field.label}
                      {field.optional ? ' (optional)' : ' *'}
                    </label>
                    <input
                      id={id}
                      type={field.type || 'text'}
                      value={form[field.key]}
                      placeholder={field.placeholder}
                      onChange={update(field.key)}
                      inputMode={field.key === 'zip' ? 'numeric' : undefined}
                      maxLength={field.key === 'zip' ? 6 : undefined}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? `${id}-error` : undefined}
                      className={invalid ? 'has-error' : ''}
                    />
                    {invalid && (
                      <p className="checkout-field-error" id={`${id}-error`}>
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="checkout-card" aria-labelledby="payment-heading">
            <h2 id="payment-heading">Payment method</h2>

            <div className="checkout-payment-options" role="radiogroup" aria-labelledby="payment-heading">
              <label
                className={`checkout-payment-option${method === 'cod' ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={method === 'cod'}
                  // Once an online order exists it already holds this stock,
                  // so switching to cash on delivery now would order the same
                  // sarees twice. Complete or cancel that order first.
                  disabled={!!pendingOrderId}
                  onChange={() => setMethod('cod')}
                />
                <span className="checkout-payment-body">
                  <strong>Cash on delivery</strong>
                  <span>
                    Nothing is charged now. The amount is settled with the
                    manufacturer when the saree is delivered.
                  </span>
                </span>
              </label>

              <label
                className={`checkout-payment-option${method === 'razorpay' ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="razorpay"
                  checked={method === 'razorpay'}
                  onChange={() => setMethod('razorpay')}
                />
                <span className="checkout-payment-body">
                  <strong>Pay online · {formatINR(total)}</strong>
                  <span>
                    Card, UPI or netbanking through Razorpay. Nothing is
                    captured until the server has verified Razorpay&rsquo;s
                    signature.
                  </span>
                </span>
              </label>
            </div>

            {method === 'razorpay' && pendingOrderId && (
              <p className="checkout-payment-note" role="status">
                Your earlier attempt was saved. Pressing the button below will
                reopen the payment for that same order - no second order is
                created.
              </p>
            )}
          </section>
        </div>

        <aside className="checkout-summary" aria-label="Order summary">
          <h2>Order summary</h2>

          <ul className="checkout-items">
            {lines.map((line) => (
              <li key={line.key} className="checkout-item">
                <Link to={productLink(line.product)} className="checkout-item-image">
                  <img src={productImage(line.product)} alt={line.name} loading="lazy" />
                  <span className="checkout-item-qty">{line.quantity}</span>
                </Link>
                <div className="checkout-item-info">
                  <Link to={productLink(line.product)}>{line.name}</Link>
                  <span>{formatINR(line.price)} each</span>
                </div>
                <strong>{formatINR(line.lineTotal)}</strong>
              </li>
            ))}
          </ul>

          <div className="checkout-totals">
            <div className="checkout-total-row">
              <span>Subtotal</span>
              <strong>{formatINR(total)}</strong>
            </div>
            <div className="checkout-total-row">
              <span>Delivery charge</span>
              <strong>None</strong>
            </div>
          </div>

          <div className="checkout-grand">
            <span>Total payable</span>
            <strong>{formatINR(total)}</strong>
          </div>

          <button type="submit" className="checkout-submit" disabled={placing}>
            {placing ? (
              method === 'razorpay' ? 'Opening payment…' : 'Placing your order…'
            ) : (
              <>
                {method === 'razorpay'
                  ? pendingOrderId
                    ? `Retry payment ${formatINR(total)}`
                    : `Pay ${formatINR(total)}`
                  : 'Place order'}
                <IconArrowRight size={18} />
              </>
            )}
          </button>

          <p className="checkout-note">
            Stock is re-checked when the order is placed, so an item can sell out
            between adding it and paying.
          </p>
        </aside>
      </form>
    </div>
  )
}
