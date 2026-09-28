export const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN')

export const formatCompact = (n) => {
  const value = Number(n || 0)
  if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr'
  if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L'
  if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + 'K'
  return '₹' + value
}

export const discountPercent = (price, mrp) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0
