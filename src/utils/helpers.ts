// Utility functions for the application

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date and time to a readable string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): {
  years: number;
  months: number;
  days: number;
  displayString: string;
} {
  const birth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  const ageInMs = today.getTime() - birth.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(ageInDays / 365);
  const months = Math.floor((ageInDays % 365) / 30);
  const days = ageInDays % 30;
  
  let displayString = '';
  if (years > 0) {
    displayString = `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) displayString += ` ${months} month${months > 1 ? 's' : ''}`;
  } else if (months > 0) {
    displayString = `${months} month${months > 1 ? 's' : ''}`;
  } else {
    displayString = `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return { years, months, days, displayString };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format weight with units
 */
export function formatWeight(weight: number, unit: 'kg' | 'lb' = 'kg'): string {
  return `${weight.toFixed(1)} ${unit}`;
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: 'text-green-600 bg-green-100',
    sick: 'text-red-600 bg-red-100',
    quarantine: 'text-yellow-600 bg-yellow-100',
    deceased: 'text-gray-600 bg-gray-100',
    completed: 'text-green-600 bg-green-100',
    ongoing: 'text-blue-600 bg-blue-100',
    scheduled: 'text-yellow-600 bg-yellow-100',
    pending: 'text-orange-600 bg-orange-100',
    delivered: 'text-green-600 bg-green-100',
    'in-transit': 'text-blue-600 bg-blue-100',
  };
  
  return colors[status.toLowerCase()] || 'text-gray-600 bg-gray-100';
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a random ID (for demo purposes)
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Calculate days until a future date
 */
export function daysUntil(futureDate: Date | string): number {
  const future = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;
  const today = new Date();
  const diffInMs = future.getTime() - today.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Group array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by a date field
 */
export function sortByDate<T>(
  array: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField] as any).getTime();
    const dateB = new Date(b[dateField] as any).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}
