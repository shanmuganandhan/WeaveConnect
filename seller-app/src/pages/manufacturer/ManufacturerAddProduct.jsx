import { useNavigate, Link } from 'react-router-dom'
import { useManufacturer } from '../../context/ManufacturerContext'
import { ProductForm } from '../../components/manufacturer/ProductForm'

export default function ManufacturerAddProduct() {
  const { addProduct, showToast } = useManufacturer()
  const navigate = useNavigate()

  // Only leave the form once the server has confirmed the product was created.
  const handleSave = async (payload) => {
    try {
      await addProduct(payload)
      navigate('/seller/products')
    } catch (err) {
      showToast(err.message || 'Could not add this product', 'error')
    }
  }

  return (
    <div className="md-page-title">
      <div>
        <h1>Add Product</h1>
        <span>List a new saree on your storefront.</span>
      </div>
      <Link to="/seller/products" className="md-btn-ghost">Cancel</Link>

      <div className="md-add-product-card">
        <ProductForm
          submitLabel="Add Product"
          showDescription
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
