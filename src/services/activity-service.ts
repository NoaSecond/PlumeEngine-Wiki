// Activity service using the backend API
import authService from './auth-service';
import { logger } from '../utils/logger';
import { getConfigService } from './config-service';

export interface Activity {
  id: number;
  user_id: number;
  type: string;
  title: string;
  description?: string;
  icon?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  username?: string; // Added by admin requests
}

// Compatibility interface with the old service
export interface ActivityLog {
  id: number;
  timestamp: string;
  userId?: number;
  username: string;
  action: string;
  target?: string;
  details: string;
  ip?: string;
  userAgent?: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
}

interface CreateActivityResponse {
  success: boolean;
  message: string;
  activity?: Activity;
}

class ActivityService {
  private configService = getConfigService();

  private getBaseUrl(): string {
    return this.configService.getApiUrl('/activities');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('wiki_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async getActivities(page: number = 1, limit: number = 50): Promise<{ activities: Activity[]; hasMore: boolean } | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return {
          activities: data.activities,
          hasMore: data.pagination?.hasMore ?? false
        };
      } else {
        logger.warn('Failed to retrieve activities', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Error retrieving activities', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async getTodayActivities(): Promise<Activity[] | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/today`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return data.activities;
      } else {
        logger.warn('Failed to retrieve today\'s activities', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Error retrieving today\'s activities', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async searchActivities(searchTerm: string, limit: number = 50): Promise<Activity[] | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return data.activities;
      } else {
        logger.warn('Failed to search activities', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Error searching activities', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async createActivity(
    type: string,
    title: string,
    description?: string,
    icon?: string,
    metadata?: Record<string, unknown>
  ): Promise<Activity | null> {
    try {
      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type,
          title,
          description: description || '',
          icon: icon || 'star',
          metadata: metadata || {}
        })
      });

      const data: CreateActivityResponse = await response.json();

      if (data.success && data.activity) {
        logger.info('Activity created', { title, type });
        return data.activity;
      } else {
        logger.warn('Failed to create activity', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Error creating activity', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async getAllActivities(page: number = 1, limit: number = 100): Promise<{ activities: Activity[]; hasMore: boolean } | null> {
    if (!authService.isAdmin()) {
      logger.warn('Attempted admin access without permissions');
      return null;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/admin/all?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return {
          activities: data.activities,
          hasMore: data.pagination?.hasMore ?? false
        };
      } else {
        logger.warn('Failed to retrieve all activities', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Error retrieving all activities', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Compatibility methods with the old service
  async addLog(activity: {
    action: string;
    target?: string;
    details: string;
  }): Promise<void> {
    await this.createActivity(
      'legacy',
      activity.action,
      activity.details,
      'activity',
      { target: activity.target }
    );
  }

  async getLogs(limit: number = 50): Promise<ActivityLog[]> {
    try {
      // If admin, use admin endpoint to see everything
      if (authService.isAdmin()) {
        const response = await fetch(`${this.getBaseUrl()}/admin/all?limit=${limit}`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        const data: ActivitiesResponse = await response.json();
        if (data.success) return this.mapActivitiesToLogs(data.activities);
      }

      // Otherwise, use standard endpoint (public or user-specific activities)
      const response = await fetch(`${this.getBaseUrl()}?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      const data: ActivitiesResponse = await response.json();
      if (data.success) return this.mapActivitiesToLogs(data.activities);

      return [];
    } catch (error) {
      logger.error('Error retrieving logs:', { error: String(error) });
      return [];
    }
  }

  private mapActivitiesToLogs(activities: Activity[]): ActivityLog[] {
    return (activities || []).map(activity => ({
      id: activity.id,
      timestamp: activity.created_at,
      userId: activity.user_id,
      username: activity.username || 'Unknown User',
      action: activity.type,
      target: typeof activity.metadata?.target === 'string' ? activity.metadata.target : undefined,
      details: activity.description || activity.title || '',
      ip: typeof activity.metadata?.ip === 'string' ? activity.metadata.ip : undefined,
      userAgent: typeof activity.metadata?.userAgent === 'string' ? activity.metadata.userAgent : undefined
    }));
  }

  // Old implementation for reference (replaced above)
  // Legacy methods removed


  async getActivityStats(): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    topUsers: Array<{ username: string; count: number }>;
    recentActivity: ActivityLog[];
  }> {
    // For statistics, we need all activities
    const result = await this.getAllActivities(1, 1000);
    const activities = result?.activities ?? [];

    const logsByAction: Record<string, number> = {};
    activities.forEach(activity => {
      logsByAction[activity.type] = (logsByAction[activity.type] || 0) + 1;
    });

    const userCounts: Record<string, number> = {};
    activities.forEach(activity => {
      if (activity.username) {
        userCounts[activity.username] = (userCounts[activity.username] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentActivity = activities.slice(0, 10).map(activity => ({
      id: activity.id,
      timestamp: activity.created_at,
      userId: activity.user_id,
      username: activity.username || 'Utilisateur inconnu',
      action: activity.type,
      target: typeof activity.metadata?.target === 'string' ? activity.metadata.target : undefined,
      details: activity.description || activity.title || '',
      ip: typeof activity.metadata?.ip === 'string' ? activity.metadata.ip : undefined,
      userAgent: typeof activity.metadata?.userAgent === 'string' ? activity.metadata.userAgent : undefined
    }));

    return {
      totalLogs: activities.length,
      logsByAction,
      topUsers,
      recentActivity
    };
  }

  formatAction(action: string): string {
    const actionLabels: Record<string, string> = {
      auth: 'Authentication',
      system: 'System',
      wiki: 'Wiki',
      admin: 'Administration',
      legacy: 'Activity',
      login: 'Login',
      logout: 'Logout',
      create_page: 'Create Page',
      edit_page: 'Edit Page',
      delete_page: 'Delete Page',
      register: 'Register'
    };

    return actionLabels[action] || action;
  }

  getActionIcon(action: string): string {
    const actionIcons: Record<string, string> = {
      auth: '🔐',
      system: '⚙️',
      wiki: '📖',
      admin: '👑',
      legacy: '📝',
      login: '🚪',
      logout: '👋',
      create_page: '📄',
      edit_page: '✏️',
      delete_page: '🗑️',
      register: '👤',
      create_section: '➕',
      edit_section: '✏️',
      delete_section: '❌'
    };

    return actionIcons[action] || '📝';
  }
}

const activityService = new ActivityService();
export default activityService;
