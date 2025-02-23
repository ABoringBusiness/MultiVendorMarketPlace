export const ROLES = {
  // New roles
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  // Legacy roles
  BIDDER: 'bidder',
  AUCTIONEER: 'auctioneer',
  SUPER_ADMIN: 'super_admin'
};

export const ROLE_MAPPINGS = {
  [ROLES.BIDDER]: ROLES.BUYER,
  [ROLES.AUCTIONEER]: ROLES.SELLER,
  [ROLES.SUPER_ADMIN]: ROLES.ADMIN
};

// Helper functions
export const isLegacyRole = (role) => {
  return [ROLES.BIDDER, ROLES.AUCTIONEER, ROLES.SUPER_ADMIN].includes(role);
};

export const getNewRole = (legacyRole) => {
  return ROLE_MAPPINGS[legacyRole] || legacyRole;
};
