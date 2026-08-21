/**
 * Formats errors (including MongoDB duplicate key E11000 errors and Zod errors)
 * into clean, user-friendly strings.
 */
export const formatErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;

  // Handle MongoDB E11000 duplicate key error
  if (error.code === 11000 || error.name === 'MongoServerError' || (typeof error.message === 'string' && error.message.includes('E11000'))) {
    const key = error.keyPattern ? Object.keys(error.keyPattern)[0] : '';
    const msg = error.message || '';

    if (key === 'email' || msg.includes('email')) {
      return 'An account with this email address already exists.';
    }
    if (key === 'phone' || msg.includes('phone')) {
      return 'An account with this phone number already exists.';
    }
    return 'An account with this information already exists.';
  }

  // Handle Zod validation errors
  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0].message || defaultMessage;
  }

  return error.message || defaultMessage;
};
