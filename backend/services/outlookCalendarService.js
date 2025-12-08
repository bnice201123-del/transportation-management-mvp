import axios from 'axios';
import User from '../models/User.js';

const MICROSOFT_GRAPH_API = 'https://graph.microsoft.com/v1.0';

class OutlookCalendarService {
  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID;
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/calendar/outlook/callback';
    this.authority = 'https://login.microsoftonline.com/common';
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(userId) {
    const scopes = 'Calendars.ReadWrite offline_access';
    const authUrl = `${this.authority}/oauth2/v2.0/authorize?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&state=${userId}`;

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    try {
      const tokenEndpoint = `${this.authority}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('code', code);
      params.append('redirect_uri', this.redirectUri);
      params.append('grant_type', 'authorization_code');

      const response = await axios.post(tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expiry_date: Date.now() + (response.data.expires_in * 1000)
      };
    } catch (error) {
      console.error('Error getting tokens:', error.response?.data || error);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const tokenEndpoint = `${this.authority}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');

      const response = await axios.post(tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        expiry_date: Date.now() + (response.data.expires_in * 1000)
      };
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Save tokens to user account
   */
  async saveUserTokens(userId, tokens) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.outlookCalendar': {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          enabled: true,
          lastSync: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw new Error('Failed to save calendar tokens');
    }
  }

  /**
   * Get valid access token for user
   */
  async getAccessToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.outlookCalendar?.enabled) {
        throw new Error('Outlook Calendar not connected');
      }

      let { accessToken, refreshToken, expiryDate } = user.integrations.outlookCalendar;

      // Refresh token if expired or about to expire (5 min buffer)
      if (Date.now() >= (expiryDate - 300000)) {
        const newTokens = await this.refreshAccessToken(refreshToken);
        await this.saveUserTokens(userId, newTokens);
        accessToken = newTokens.access_token;
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  /**
   * Create calendar event from schedule
   */
  async createEvent(userId, schedule) {
    try {
      const accessToken = await this.getAccessToken(userId);

      const event = {
        subject: `Shift - ${schedule.shiftType}`,
        body: {
          contentType: 'HTML',
          content: `
            <p><strong>Location:</strong> ${schedule.location || 'N/A'}</p>
            <p><strong>Vehicle:</strong> ${schedule.vehicle?.vehicleNumber || 'N/A'}</p>
            <p><strong>Notes:</strong> ${schedule.notes || ''}</p>
          `
        },
        start: {
          dateTime: schedule.startTime,
          timeZone: 'America/New_York' // TODO: Make configurable
        },
        end: {
          dateTime: schedule.endTime,
          timeZone: 'America/New_York'
        },
        isReminderOn: true,
        reminderMinutesBeforeStart: 30,
        categories: [this.getCategoryForShiftType(schedule.shiftType)]
      };

      const response = await axios.post(
        `${MICROSOFT_GRAPH_API}/me/events`,
        event,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.id; // Return event ID
    } catch (error) {
      console.error('Error creating calendar event:', error.response?.data || error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(userId, eventId, schedule) {
    try {
      const accessToken = await this.getAccessToken(userId);

      const event = {
        subject: `Shift - ${schedule.shiftType}`,
        body: {
          contentType: 'HTML',
          content: `
            <p><strong>Location:</strong> ${schedule.location || 'N/A'}</p>
            <p><strong>Vehicle:</strong> ${schedule.vehicle?.vehicleNumber || 'N/A'}</p>
            <p><strong>Notes:</strong> ${schedule.notes || ''}</p>
          `
        },
        start: {
          dateTime: schedule.startTime,
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: schedule.endTime,
          timeZone: 'America/New_York'
        },
        categories: [this.getCategoryForShiftType(schedule.shiftType)]
      };

      await axios.patch(
        `${MICROSOFT_GRAPH_API}/me/events/${eventId}`,
        event,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error.response?.data || error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(userId, eventId) {
    try {
      const accessToken = await this.getAccessToken(userId);

      await axios.delete(
        `${MICROSOFT_GRAPH_API}/me/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error.response?.data || error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Sync all schedules to calendar
   */
  async syncSchedules(userId, schedules) {
    try {
      const results = {
        created: 0,
        updated: 0,
        failed: 0
      };

      for (const schedule of schedules) {
        try {
          if (schedule.outlookEventId) {
            await this.updateEvent(userId, schedule.outlookEventId, schedule);
            results.updated++;
          } else {
            const eventId = await this.createEvent(userId, schedule);
            schedule.outlookEventId = eventId;
            await schedule.save();
            results.created++;
          }
        } catch (error) {
          console.error(`Failed to sync schedule ${schedule._id}:`, error);
          results.failed++;
        }
      }

      // Update last sync time
      await User.findByIdAndUpdate(userId, {
        'integrations.outlookCalendar.lastSync': new Date()
      });

      return results;
    } catch (error) {
      console.error('Error syncing schedules:', error);
      throw new Error('Failed to sync schedules');
    }
  }

  /**
   * Get category for shift type
   */
  getCategoryForShiftType(shiftType) {
    const categories = {
      morning: 'Morning Shift',
      afternoon: 'Afternoon Shift',
      evening: 'Evening Shift',
      night: 'Night Shift',
      split: 'Split Shift',
      'on-call': 'On-Call'
    };
    return categories[shiftType] || 'Work Shift';
  }

  /**
   * Disconnect Outlook Calendar
   */
  async disconnect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.outlookCalendar': {
          enabled: false,
          accessToken: null,
          refreshToken: null,
          expiryDate: null
        }
      });
      return true;
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      throw new Error('Failed to disconnect calendar');
    }
  }
}

export default new OutlookCalendarService();
