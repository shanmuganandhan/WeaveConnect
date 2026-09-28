// Returns the effective approval status for a user.
// New accounts store `approvalStatus` (pending / approved / rejected).
// Older accounts only have the boolean `isApproved`, so fall back to it:
// isApproved === false means pending, otherwise approved.
const approvalStatusFor = (user) => {
  if (user.approvalStatus) return user.approvalStatus;
  return user.isApproved === false ? 'pending' : 'approved';
};

module.exports = approvalStatusFor;
