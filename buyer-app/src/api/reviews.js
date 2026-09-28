import api from './client'

// Reviews for a product. This one is public, so anyone (even a guest) can read
// the reviews and the average rating.
export async function getProductReviews(productId) {
  return await api.get(`/reviews/product/${productId}`)
}

// The signed-in buyer's own review, or null if they have not reviewed yet.
export async function getMyReview(productId) {
  return await api.get(`/reviews/product/${productId}/mine`)
}

// Tells the product page whether to show the "write a review" form.
// Only a buyer who has actually purchased the product is allowed to review it.
export async function getReviewEligibility(productId) {
  return await api.get(`/reviews/product/${productId}/can-review`)
}

export async function createReview(productId, { rating, text = '' }) {
  return await api.post(`/reviews/product/${productId}`, { rating, text })
}

export async function updateReview(reviewId, { rating, text = '' }) {
  return await api.put(`/reviews/${reviewId}`, { rating, text })
}

export async function deleteReview(reviewId) {
  return await api.delete(`/reviews/${reviewId}`)
}
