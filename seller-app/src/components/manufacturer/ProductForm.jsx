import { useState } from 'react'
import useEscape from '../../hooks/useEscape'
import { IconCheck, IconX, IconTrash, IconCamera } from '../ui/Icons'
import { uploadProductImages } from '../../api/manufacturerApi'
import { useManufacturer } from '../../context/ManufacturerContext'
import { productStatus, STATUS_ACTIVE, STATUS_LOW_STOCK, STATUS_OUT_OF_STOCK } from '../../utils/product'

export function ProductForm({ initial, submitLabel, showDescription = false, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          category: initial.category,
          price: initial.price,
          stock: initial.stock,
          // The Product model stores isAvailable + stock, never a "status",
          // so the dropdown has to be seeded from the real fields.
          status: productStatus(initial),
          description: initial.description || '',
          images: initial.images || [],
        }
      : { name: '', category: 'Kanchipuram', price: '', stock: '', status: STATUS_ACTIVE, description: '', images: [] }
  )
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  // The layout renders the <Toast> bound to the provider's state, so the form
  // has to raise toasts through the context rather than a local hook.
  const { showToast } = useManufacturer()

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (form.images.length + files.length > 5) {
      setUploadError('Maximum 5 images allowed')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const res = await uploadProductImages(files)
      const newUrls = res.data.urls || []
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newUrls] }))
      showToast('Images uploaded successfully!')
    } catch (err) {
      setUploadError(err.message || 'Failed to upload images')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Product name is required'
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Enter a valid price'
    if (form.stock === '' || Number(form.stock) < 0) nextErrors.stock = 'Enter valid stock'
    if (showDescription && !form.description.trim()) nextErrors.description = 'Add a short description'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      // Translate the view-level status into the field the API persists.
      const { status, ...rest } = form
      onSave({
        ...rest,
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        isAvailable: status !== STATUS_OUT_OF_STOCK,
      })
      if (onCancel) onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="md-form-row">
        <label className="md-field">
          <span>Product Name *</span>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="e.g. Kanchipuram Bridal Silk"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <small className="md-field-error">{errors.name}</small>}
        </label>
        <label className="md-field">
          <span>Category *</span>
          <select value={form.category} onChange={update('category')}>
            {['Kanchipuram', 'Banarasi', 'Mysore', 'Patola', 'Pochampally', 'Paithani'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="md-form-row">
        <label className="md-field">
          <span>Price (₹) *</span>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={update('price')}
            placeholder="e.g. 45000"
            className={errors.price ? 'error' : ''}
          />
          {errors.price && <small className="md-field-error">{errors.price}</small>}
        </label>
        <label className="md-field">
          <span>Stock Quantity *</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={update('stock')}
            placeholder="e.g. 10"
            className={errors.stock ? 'error' : ''}
          />
          {errors.stock && <small className="md-field-error">{errors.stock}</small>}
        </label>
      </div>
      {showDescription && (
        <label className="md-field">
          <span>Description *</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={update('description')}
            placeholder="Describe the weave, motifs, zari and colour..."
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <small className="md-field-error">{errors.description}</small>}
        </label>
      )}
      <label className="md-field">
        <span>Product Images</span>
        <div className="md-image-upload">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            disabled={uploading || form.images.length >= 5}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload" className="md-upload-btn">
            <IconCamera size={20} />
            <span>{uploading ? 'Uploading...' : form.images.length >= 5 ? 'Max 5 images' : 'Select Images'}</span>
          </label>
          {form.images.length > 0 && (
            <span className="md-upload-hint">{form.images.length}/5 images selected</span>
          )}
          {uploadError && <small className="md-field-error">{uploadError}</small>}
        </div>
        {form.images.length > 0 && (
          <div className="md-image-previews" role="list" aria-label="Selected product images">
            {form.images.map((url, index) => (
              <div key={index} className="md-image-preview" role="listitem">
                <span className="md-image-index" aria-hidden="true">{index + 1}</span>
                <img src={url} alt={`Product image ${index + 1}`} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="100%25" height="100%25" fill="%23f5ead9"/%3E%3Ctext x="50%25" y="50%25" fill="%23b3a18e" font-size="9" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif"%3ENo image%3C/text%3E%3C/svg%3E' }} />
                <button
                  type="button"
                  className="md-image-remove"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                >
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </label>
      <label className="md-field">
        <span>Status</span>
        <select value={form.status} onChange={update('status')}>
          <option value={STATUS_ACTIVE}>{STATUS_ACTIVE}</option>
          <option value={STATUS_LOW_STOCK}>{STATUS_LOW_STOCK}</option>
          <option value={STATUS_OUT_OF_STOCK}>{STATUS_OUT_OF_STOCK}</option>
        </select>
      </label>
      <div className="md-modal-actions">
        {onCancel && (
          <button type="button" className="md-btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="md-btn-primary" disabled={uploading}>
          <IconCheck size={18} /> {submitLabel}
        </button>
      </div>
    </form>
  )
}

export function ProductModal({ product, onSave, onClose }) {
  useEscape(onClose)
  return (
    <div className="md-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-header">
          <h3 id="product-modal-title">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button type="button" className="md-icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={20} />
          </button>
        </div>
        <ProductForm
          initial={product}
          submitLabel={product ? 'Save Changes' : 'Add Product'}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

export function DeleteConfirm({ product, onConfirm, onClose }) {
  useEscape(() => onClose())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Keep the dialog open until the server has actually confirmed the delete,
  // so a failure is visible instead of the row silently reappearing.
  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onConfirm(product._id)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not delete this product')
      setBusy(false)
    }
  }

  return (
    <div className="md-modal-overlay" onClick={busy ? undefined : onClose} role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="md-modal md-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-header">
          <h3 id="delete-title">Delete Product?</h3>
          <button type="button" className="md-icon-btn" onClick={onClose} aria-label="Close" disabled={busy}>
            <IconX size={20} />
          </button>
        </div>
        <p className="md-delete-text">
          <strong>"{product.name}"</strong> will be permanently removed from your store.
          This action cannot be undone.
        </p>
        {error && <small className="md-field-error">{error}</small>}
        <div className="md-modal-actions">
          <button type="button" className="md-btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="md-btn-danger" onClick={handleConfirm} disabled={busy}>
            <IconTrash size={16} /> {busy ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  )
}
