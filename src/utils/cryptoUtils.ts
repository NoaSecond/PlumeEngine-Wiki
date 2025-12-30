// Hashing utilities for password and email security
// Uses native Web Crypto API from the browser

export class CryptoUtils {
  // Generate a random salt
  static generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate a unique ID
  static generateId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encode a string to bytes for Crypto API
  static encodeString(str: string): ArrayBuffer {
    return new TextEncoder().encode(str).buffer;
  }

  // Convert ArrayBuffer to hexadecimal string
  static bufferToHex(buffer: ArrayBuffer): string {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
      const value = view.getUint32(i);
      const stringValue = value.toString(16);
      const padding = '00000000';
      const paddedValue = (padding + stringValue).slice(-padding.length);
      hexCodes.push(paddedValue);
    }
    return hexCodes.join('');
  }

  // Hash a password with salt
  static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const usedSalt = salt || this.generateSalt();
    const data = new Uint8Array(this.encodeString(password + usedSalt));
    
    // Use SHA-256 with multiple iterations for more security
    let hash = await crypto.subtle.digest('SHA-256', data);
    
    // Perform multiple iterations to slow down brute force attacks
    for (let i = 0; i < 10000; i++) {
      const combined = new Uint8Array(hash.byteLength + data.byteLength);
      combined.set(new Uint8Array(hash), 0);
      combined.set(data, hash.byteLength);
      hash = await crypto.subtle.digest('SHA-256', combined);
    }
    
    return {
      hash: this.bufferToHex(hash),
      salt: usedSalt
    };
  }

  // Verify a password
  static async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    const { hash } = await this.hashPassword(password, salt);
    return hash === storedHash;
  }

  // Hash an email (for privacy)
  static async hashEmail(email: string): Promise<string> {
    const data = new Uint8Array(this.encodeString(email.toLowerCase().trim()));
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.bufferToHex(hash);
  }

  // Create a unique identifier based on hashed email (for searches)
  static async createEmailIdentifier(email: string): Promise<string> {
    const hash = await this.hashEmail(email);
    // Take only the first 16 characters for a shorter identifier
    return hash.substring(0, 16);
  }

  // Partially mask an email for display
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email; // Invalid email
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    
    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2
      ? domainName.substring(0, 2) + '*'.repeat(domainName.length - 2)
      : domainName;
    
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must contain at least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add numbers');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add special characters (!@#$%^&*...)');
    }

    if (password.length >= 12) {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  // Generate a secure password
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    const password = [];
    
    // Ensure at least one character of each type is present
    password.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    password.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    password.push(numbers[Math.floor(Math.random() * numbers.length)]);
    password.push(symbols[Math.floor(Math.random() * symbols.length)]);
    
    // Fill with random characters
    for (let i = 4; i < length; i++) {
      password.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }
    
    // Shuffle the array
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }
    
    return password.join('');
  }
}
