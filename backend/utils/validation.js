/**
 * Validates user data for registration
 * @param {Object} userData - The user data to validate
 * @returns {string|null} - Error message or null if validation passes
 */
const validateUserData = (userData) => {
  const { username, password, companyName, phoneNumbers, role } = userData;

  // Check required fields
  if (!username || !password || !companyName || !phoneNumbers || !role) {
    return 'جميع الحقول مطلوبة';
  }

  // Validate username (at least 3 characters)
  if (username.length < 3) {
    return 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل';
  }

  // Validate password (at least 6 characters)
  if (password.length < 6) {
    return 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
  }

  // Validate company name
  if (companyName.trim().length === 0) {
    return 'اسم الشركة مطلوب';
  }

  // Validate phone numbers
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return 'يجب إدخال رقم هاتف واحد على الأقل';
  }

  // Validate phone number format (accept any non-empty phone number)
  const validPhoneNumbers = phoneNumbers.filter(phone => phone.trim() !== '');
  if (validPhoneNumbers.length === 0) {
    return 'يجب إدخال رقم هاتف واحد على الأقل';
  }

  // Validate role
  if (role !== 'admin' && role !== 'pos_agent') {
    return 'نوع الحساب غير صالح';
  }

  // All validations passed
  return null;
};

module.exports = {
  validateUserData,
}; 