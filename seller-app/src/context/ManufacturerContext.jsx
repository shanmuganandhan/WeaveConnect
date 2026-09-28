import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as manufacturerApi from '../api/manufacturerApi'
import { useToast } from '../hooks/useToast'

const ManufacturerContext = createContext(null)

export function ManufacturerProvider({ children }) {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pRes, oRes, aRes, prRes] = await Promise.all([
        manufacturerApi.getMyProducts({ limit: 100 }),
        manufacturerApi.getMyOrders(),
        manufacturerApi.getManufacturerAnalytics(),
        manufacturerApi.getMyProfile(),
      ])
      setProducts(pRes.data.products || [])
      setOrders(oRes.data.orders || [])
      setAnalytics(aRes.data.analytics || null)
      setProfile(prRes.data.profile || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addProduct = useCallback(async (payload) => {
    await manufacturerApi.createMyProduct(payload)
    const res = await manufacturerApi.getMyProducts({ limit: 100 })
    setProducts(res.data.products || [])
    showToast('Product added successfully!')
  }, [showToast])

  const updateProduct = useCallback(async (id, payload) => {
    await manufacturerApi.updateMyProduct(id, payload)
    const res = await manufacturerApi.getMyProducts({ limit: 100 })
    setProducts(res.data.products || [])
    showToast('Product updated successfully!')
  }, [showToast])

  const deleteProduct = useCallback(async (id) => {
    await manufacturerApi.deleteMyProduct(id)
    setProducts((prev) => prev.filter((p) => p._id !== id))
    showToast('Product deleted.')
  }, [showToast])

  const updateOrderStatus = useCallback(async (id, status) => {
    await manufacturerApi.updateMyOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
    showToast(`Order marked as ${status}.`)
  }, [showToast])

  const updateProfile = useCallback(async (payload) => {
    const res = await manufacturerApi.updateMyProfile(payload)
    setProfile(res.data.profile || null)
    showToast('Profile updated successfully!')
  }, [showToast])

  const value = useMemo(
    () => ({
      products,
      orders,
      analytics,
      profile,
      loading,
      error,
      toast,
      showToast,
      refresh,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      updateProfile,
    }),
    [products, orders, analytics, profile, loading, error, toast, showToast, refresh,
     addProduct, updateProduct, deleteProduct, updateOrderStatus, updateProfile]
  )

  return <ManufacturerContext.Provider value={value}>{children}</ManufacturerContext.Provider>
}

export function useManufacturer() {
  const ctx = useContext(ManufacturerContext)
  if (!ctx) throw new Error('useManufacturer must be used within ManufacturerProvider')
  return ctx
}
