import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as adminApi from '../api/adminApi'
import { useToast } from '../hooks/useToast'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [users, setUsers] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [pendingManufacturers, setPendingManufacturers] = useState([])
  const [buyers, setBuyers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { toast, showToast } = useToast()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [uRes, mRes, pendingRes, bRes, pRes, oRes, aRes] = await Promise.all([
        adminApi.getAdminUsers(),
        adminApi.getAdminManufacturers(),
        adminApi.getAdminPendingManufacturers(),
        adminApi.getAdminBuyers(),
        adminApi.getAdminProducts(),
        adminApi.getAdminOrders(),
        adminApi.getAdminAnalytics(),
      ])
      setUsers(uRes.data.users || [])
      setManufacturers(mRes.data.manufacturers || [])
      setPendingManufacturers(pendingRes.data.manufacturers || [])
      setBuyers(bRes.data.buyers || [])
      setProducts(pRes.data.products || [])
      setOrders(oRes.data.orders || [])
      setAnalytics(aRes.data.analytics || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const deleteUser = useCallback(async (id) => {
    await adminApi.adminDeleteUser(id)
    setUsers((prev) => prev.filter((u) => u._id !== id))
    setManufacturers((prev) => prev.filter((m) => m._id !== id))
    setBuyers((prev) => prev.filter((b) => b._id !== id))
    showToast('User deleted.')
  }, [showToast])

  const deleteProduct = useCallback(async (id) => {
    await adminApi.adminDeleteProduct(id)
    setProducts((prev) => prev.filter((p) => p._id !== id))
    showToast('Product deleted.')
  }, [showToast])

  const blockUser = useCallback(async (id) => {
    await adminApi.adminBlockUser(id)
    const patch = (list) => list.map((u) => (u._id === id ? { ...u, isBlocked: true } : u))
    setUsers(patch)
    setManufacturers(patch)
    setBuyers(patch)
    showToast('User blocked.')
  }, [showToast])

  const unblockUser = useCallback(async (id) => {
    await adminApi.adminUnblockUser(id)
    const patch = (list) => list.map((u) => (u._id === id ? { ...u, isBlocked: false } : u))
    setUsers(patch)
    setManufacturers(patch)
    setBuyers(patch)
    showToast('User unblocked.')
  }, [showToast])

  const approveManufacturer = useCallback(async (id) => {
    await adminApi.adminApproveManufacturer(id)
    setManufacturers((prev) => prev.map((m) => (m._id === id ? { ...m, approvalStatus: 'approved', isApproved: true, isBlocked: false } : m)))
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, approvalStatus: 'approved', isApproved: true, isBlocked: false } : u)))
    setPendingManufacturers((prev) => prev.filter((m) => m._id !== id))
    showToast('Manufacturer approved.')
  }, [showToast])

  const rejectManufacturer = useCallback(async (id) => {
    await adminApi.adminRejectManufacturer(id)
    setManufacturers((prev) => prev.map((m) => (m._id === id ? { ...m, approvalStatus: 'rejected', isApproved: false } : m)))
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, approvalStatus: 'rejected', isApproved: false } : u)))
    setPendingManufacturers((prev) => prev.filter((m) => m._id !== id))
    showToast('Manufacturer rejected.')
  }, [showToast])

  const disapproveManufacturer = useCallback(async (id) => {
    await adminApi.adminDisapproveManufacturer(id)
    setManufacturers((prev) => prev.map((m) => (m._id === id ? { ...m, approvalStatus: 'pending', isApproved: false } : m)))
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, approvalStatus: 'pending', isApproved: false } : u)))
    showToast('Manufacturer approval revoked.')
  }, [showToast])

  const updateOrderStatus = useCallback(async (id, status) => {
    await adminApi.adminUpdateOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)))
    showToast(`Order marked as ${status}.`)
  }, [showToast])

  const activityMap = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      const id = o.buyer?._id
      if (id) map[id] = (map[id] || 0) + 1
    })
    return map
  }, [orders])

  const manufacturerStats = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      ;(o.items || []).forEach((it) => {
        const id = it.manufacturer?.toString?.() || it.manufacturer
        if (!id) return
        map[id] = map[id] || { orders: 0, revenue: 0 }
        map[id].orders += 1
        if (o.status !== 'cancelled') map[id].revenue += (it.price || 0) * (it.quantity || 1)
      })
    })
    return map
  }, [orders])

  const value = useMemo(
    () => ({
      users,
      manufacturers,
      pendingManufacturers,
      buyers,
      products,
      orders,
      analytics,
      loading,
      error,
      toast,
      activityMap,
      manufacturerStats,
      refresh,
      deleteUser,
      deleteProduct,
      blockUser,
      unblockUser,
      approveManufacturer,
      rejectManufacturer,
      disapproveManufacturer,
      updateOrderStatus,
    }),
    [users, manufacturers, pendingManufacturers, buyers, products, orders, analytics, loading, error, toast,
     activityMap, manufacturerStats, refresh, deleteUser, deleteProduct, blockUser,
     unblockUser, approveManufacturer, rejectManufacturer, disapproveManufacturer, updateOrderStatus]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
