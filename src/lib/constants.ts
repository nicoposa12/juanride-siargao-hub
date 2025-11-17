export const VEHICLE_TYPES = {
  SCOOTER: 'scooter',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  VAN: 'van',
} as const

export const VEHICLE_TYPE_LABELS = {
  scooter: 'Scooter',
  motorcycle: 'Motorcycle',
  car: 'Car',
  van: 'Van',
} as const

export const VEHICLE_STATUSES = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  MAINTENANCE: 'maintenance',
} as const

export const VEHICLE_STATUS_LABELS = {
  available: 'Available',
  unavailable: 'Unavailable',
  maintenance: 'Under Maintenance',
} as const

export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
} as const

export const PAYMENT_METHODS = {
  GCASH: 'gcash',
  MAYA: 'maya',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
} as const

export const PAYMENT_METHOD_LABELS = {
  gcash: 'GCash',
  maya: 'Maya',
  card: 'Credit/Debit Card',
  bank_transfer: 'Bank Transfer',
} as const

export const USER_ROLES = {
  RENTER: 'renter',
  OWNER: 'owner',
  ADMIN: 'admin',
} as const

export const USER_ROLE_LABELS = {
  renter: 'Renter',
  owner: 'Vehicle Owner',
  admin: 'Administrator',
} as const

export const SIARGAO_LOCATIONS = [
  'General Luna',
  'Cloud 9',
  'Dapa',
  'Del Carmen',
  'Pilar',
  'San Isidro',
  'San Benito',
  'Burgos',
  'Santa Monica',
] as const

export const SERVICE_FEE_PERCENTAGE = 0.05 // 5%

export const MAX_IMAGES_PER_VEHICLE = 20
export const MIN_IMAGES_PER_VEHICLE = 3
export const MAX_IMAGE_SIZE_MB = 5

export const BOOKING_MODIFICATION_HOURS = 24 // Hours before start date to allow modification
export const REVIEW_EDIT_HOURS = 48 // Hours after creation to allow editing

