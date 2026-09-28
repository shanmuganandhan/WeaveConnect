import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuyer } from '../../context/BuyerContext'
import * as buyerApi from '../../api/buyerApi'
import { formatINR } from '../../utils/format'
import { productImage } from '../../utils/product'
import { IconLock } from '../../components/ui/Icons'
import { EmptyState, ErrorState } from '../../components/ui/States'

export default function BuyerCheckout() {
  const navigate = useNavigate()
  const { cart, clearCart, refresh } = useBuyer()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', zip: '',
  })

  const items = cart?.items || []
  const total = useMemo(() => items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0), [items])

  const update = (key) => (e) => {
    let value = e.target.value
    if (key === 'zip') value = value.replace(/\D/g, '').slice(0, 6)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Full name is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!form.addressLine1.trim()) return 'Address is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.state.trim()) return 'State is required.'
    if (!/^\d{6}$/.test(form.zip)) return 'PIN code must be a 6-digit number.'
    return null
  }

  const processOrder = async () => {
    const payload = items.map((item) => ({ productId: item.product?._id, quantity: item.quantity }))
    const res = await buyerApi.createMyOrder(payload, form)
    const orderId = res.data.order?._id
    await Promise.all(items.map((item) => buyerApi.removeFromMyCart(item.product?._id).catch(() => {})))
    clearCart()
    refresh()
    navigate(`/buyer/orders?placed=${orderId || 'true'}`, { replace: true })
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setPlacing(true)

    try {
      await processOrder()
    } catch (err) {
      setError(err.message || 'Could not place your order. Please try again.')
      setPlacing(false)
    }
  }

  if (!cart) return <div className="bd-content-message">Preparing checkout…</div>

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to checkout"
        message="Add a saree to your cart before checking out."
        action={{ label: 'Browse Collection', to: '/products' }}
      />
    )
  }

  return (
    <div className="bd-checkout">
      <section className="bd-card">
        <div className="bd-card-header">
          <h2>Shipping Details</h2>
        </div>
        <form id="checkout-form" onSubmit={handlePlaceOrder} noValidate className="bd-checkout-form">
          <div className="bd-form-row">
            <label className="bd-field">
              <span>Full Name *</span>
              <input type="text" required value={form.name} onChange={update('name')} placeholder="Recipient name" />
            </label>
            <label className="bd-field">
              <span>Phone *</span>
              <input type="tel" required value={form.phone} onChange={update('phone')} placeholder="+91 …" />
            </label>
          </div>
          <label className="bd-field">
            <span>Address Line 1 *</span>
            <input type="text" required value={form.addressLine1} onChange={update('addressLine1')} placeholder="House no, street, area" />
          </label>
          <label className="bd-field">
            <span>Address Line 2 (optional)</span>
            <input type="text" value={form.addressLine2} onChange={update('addressLine2')} placeholder="Landmark, building" />
          </label>
          <div className="bd-form-row">
            <label className="bd-field">
              <span>City *</span>
              <input type="text" required value={form.city} onChange={update('city')} />
            </label>
            <label className="bd-field">
              <span>State *</span>
              <input type="text" required value={form.state} onChange={update('state')} />
            </label>
            <label className="bd-field">
              <span>PIN Code *</span>
              <input type="text" inputMode="numeric" required value={form.zip} onChange={update('zip')} placeholder="6-digit PIN" pattern="[0-9]{6}" maxLength={6} />
            </label>
          </div>

          <div className="bd-payment-section">
            <h3>Payment Method</h3>
            <div className="bd-payment-options">
              <div className="bd-payment-option active">
                <div className="bd-payment-option-content">
                  <span className="bd-payment-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <span>Pay when you receive your order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <ErrorState compact title="Order failed" message={error} />}
        </form>
      </section>

      <section className="bd-card bd-cart-summary">
        <h2>Order Summary</h2>
        <ul className="bd-checkout-items">
          {items.map((item) => (
            <li key={item._id} className="bd-checkout-item">
              <img src={productImage(item.product)} alt={item.product?.name || 'Product'} className="bd-checkout-img" />
              <div className="bd-checkout-info">
                <span>{item.product?.name || 'Product'} × {item.quantity}</span>
              </div>
              <strong>{formatINR((item.product?.price || 0) * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <div className="bd-cart-grand">
          <span>Total (incl. delivery)</span>
          <strong>{formatINR(total)}</strong>
        </div>
        <button
          type="submit"
          form="checkout-form"
          className="bd-checkout-btn"
          disabled={placing}
        >
          <IconLock size={16} /> {placing ? 'Placing Order…' : 'Place Order'}
        </button>
        <p className="bd-checkout-note">
          Your order is sent to the weaver directly. Pay on delivery.
        </p>
      </section>
    </div>
  )
}
