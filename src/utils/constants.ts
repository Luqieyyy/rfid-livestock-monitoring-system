export const LIVESTOCK_TYPES = [
  { value: 'cows', label: 'Cows' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
] as const;

export const LIVESTOCK_STATUS = [
  { value: 'healthy', label: 'Healthy', color: 'green' },
  { value: 'sick', label: 'Sick', color: 'red' },
  { value: 'quarantine', label: 'Quarantine', color: 'yellow' },
  { value: 'deceased', label: 'Deceased', color: 'gray' },
] as const;

export const HEALTH_RECORD_TYPES = [
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'checkup', label: 'Checkup' },
  { value: 'diagnosis', label: 'Diagnosis' },
] as const;

export const HEALTH_RECORD_STATUS = [
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'ongoing', label: 'Ongoing', color: 'blue' },
  { value: 'scheduled', label: 'Scheduled', color: 'yellow' },
] as const;

export const BREEDING_STATUS = [
  { value: 'planned', label: 'Planned', color: 'yellow' },
  { value: 'pregnant', label: 'Pregnant', color: 'blue' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
] as const;

export const PAYMENT_STATUS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'partial', label: 'Partial', color: 'orange' },
  { value: 'completed', label: 'Completed', color: 'green' },
] as const;

export const DELIVERY_STATUS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'in-transit', label: 'In Transit', color: 'blue' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

// Firestore collection names
export const COLLECTIONS = {
  LIVESTOCK: 'animals',
  HEALTH_RECORDS: 'health_records',
  BREEDING_RECORDS: 'breeding_records',
  SALES: 'sales',
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  WITH_TIME: 'MM/DD/YYYY hh:mm A',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Charts
export const CHART_COLORS = {
  primary: '#22c55e',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

// Application metadata
export const APP_INFO = {
  name: 'Livestock Management System',
  version: '1.0.0',
  description: 'Professional livestock farming management platform',
} as const;

// Validation rules
export const VALIDATION = {
  TAG_ID_MIN_LENGTH: 3,
  TAG_ID_MAX_LENGTH: 50,
  BREED_MIN_LENGTH: 2,
  BREED_MAX_LENGTH: 100,
  WEIGHT_MIN: 0,
  WEIGHT_MAX: 10000,
  PRICE_MIN: 0,
  PRICE_MAX: 1000000,
  DESCRIPTION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  FIREBASE_ERROR: 'Unable to connect to database. Please try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_DATE: 'Please enter a valid date.',
  LOAD_FAILED: 'Failed to load data. Please refresh the page.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Saved successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  UPLOAD_SUCCESS: 'Upload completed successfully!',
} as const;
