export function setAuthToken(token, email) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    if (email) {
      localStorage.setItem('userEmail', email);
    } else {
      // Decode email from JWT payload as fallback
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          if (decoded.email) {
            localStorage.setItem('userEmail', decoded.email);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
}

export function getUserEmail() {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('userEmail');
    if (cached) return cached;

    // Fallback: extract from token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          if (decoded.email) {
            localStorage.setItem('userEmail', decoded.email);
            return decoded.email;
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
  }
}