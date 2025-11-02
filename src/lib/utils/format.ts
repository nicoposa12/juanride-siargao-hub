import { format as dateFnsFormat } from 'date-fns'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateFnsFormat(dateObj, formatStr)
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export function formatPhoneNumber(phone: string): string {
  // Format Philippine phone numbers
  // Example: 09171234567 -> +63 917 123 4567
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('63')) {
    const match = cleaned.match(/^63(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `+63 ${match[1]} ${match[2]} ${match[3]}`
    }
  } else if (cleaned.startsWith('0')) {
    const match = cleaned.match(/^0(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `+63 ${match[1]} ${match[2]} ${match[3]}`
    }
  }
  
  return phone
}

export function formatTime(time: string): string {
  // Format time from 24h to 12h
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

