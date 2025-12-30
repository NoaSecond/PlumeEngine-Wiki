// Date formatting utilities
import logger from './logger';

export class DateUtils {
  // Format a date in French format
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // If it's today
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // If it's yesterday
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // If it's this week
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return `${dayNames[date.getDay()]} at ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // Standard French format
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.warn('⚠️ Date formatting error', `${dateString}: ${error}`);
      return dateString; // Return the original string in case of error
    }
  }

  // Format a short date (without time)
  static formatDateShort(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      // If it's today
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      }

      // If it's this year
      if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString('fr-FR', {
          month: 'long',
          day: 'numeric'
        });
      }

      // With year
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.warn('⚠️ Short date formatting error', `${dateString}: ${error}`);
      return dateString;
    }
  }

  // Get relative timestamp (X time ago)
  static getRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMinutes < 1) {
        return "Just now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffWeeks < 4) {
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
      } else if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      } else {
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      logger.warn('⚠️ Relative time calculation error', `${dateString}: ${error}`);
      return dateString;
    }
  }

  // Get current date in ISO format (YYYY-MM-DD)
  static getCurrentDateISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get current full timestamp
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Generate a recent random date (within the last X days)
  static getRecentRandomDate(maxDaysAgo: number = 30): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const randomDate = new Date(now);
    randomDate.setDate(randomDate.getDate() - daysAgo);
    return randomDate.toISOString().split('T')[0];
  }

  // Check if a date is today
  static isToday(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }

  // Check if a date is within the last 7 days
  static isThisWeek(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    } catch {
      return false;
    }
  }
}

export default DateUtils;
