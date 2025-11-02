export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  // Philippine phone number validation
  // Accepts: 09171234567, +639171234567, 639171234567
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return true
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return true
  }
  
  return false
}

export function validatePlateNumber(plate: string): boolean {
  // Basic Philippine plate number validation
  // Accepts various formats: ABC1234, ABC-1234, ABC 1234
  const cleaned = plate.replace(/[\s-]/g, '')
  return cleaned.length >= 5 && cleaned.length <= 7
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '')
}

