import { google } from 'googleapis';
import User from '../models/User.js';

const OAuth2 = google.auth.OAuth2;

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/google/callback'
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId // Pass userId to link calendar to user
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  /**
   * Save tokens to user account
   */
  async saveUserTokens(userId, tokens) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar': {
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
   * Get authenticated calendar client for user
   */
  async getCalendarClient(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.googleCalendar?.enabled) {
        throw new Error('Google Calendar not connected');
      }

      const { accessToken, refreshToken, expiryDate } = user.integrations.googleCalendar;

      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate
      });

      // Refresh token if expired
      if (Date.now() >= expiryDate) {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        await this.saveUserTokens(userId, credentials);
        this.oauth2Client.setCredentials(credentials);
      }

      return google.calendar({ version: 'v3', auth: this.oauth2Client });
    } catch (error) {
      console.error('Error getting calendar client:', error);
      throw error;
    }
  }

  /**
   * Create calendar event from schedule
   */
  async createEvent(userId, schedule) {
    try {
      const calendar = await this.getCalendarClient(userId);

      const event = {
        summary: `Shift - ${schedule.shiftType}`,
        description: `
          Location: ${schedule.location || 'N/A'}
          Vehicle: ${schedule.vehicle?.vehicleNumber || 'N/A'}
          Notes: ${schedule.notes || ''}
        `.trim(),
        start: {
          dateTime: schedule.startTime,
          timeZone: 'America/New_York' // TODO: Make timezone configurable
        },
        end: {
          dateTime: schedule.endTime,
          timeZone: 'America/New_York'
        },
        colorId: this.getColorForShiftType(schedule.shiftType),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 60 }
          ]
        }
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.data.id; // Return event ID to store in schedule
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(userId, eventId, schedule) {
    try {
      const calendar = await this.getCalendarClient(userId);

      const event = {
        summary: `Shift - ${schedule.shiftType}`,
        description: `
          Location: ${schedule.location || 'N/A'}
          Vehicle: ${schedule.vehicle?.vehicleNumber || 'N/A'}
          Notes: ${schedule.notes || ''}
        `.trim(),
        start: {
          dateTime: schedule.startTime,
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: schedule.endTime,
          timeZone: 'America/New_York'
        },
        colorId: this.getColorForShiftType(schedule.shiftType)
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(userId, eventId) {
    try {
      const calendar = await this.getCalendarClient(userId);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
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
          if (schedule.calendarEventId) {
            await this.updateEvent(userId, schedule.calendarEventId, schedule);
            results.updated++;
          } else {
            const eventId = await this.createEvent(userId, schedule);
            schedule.calendarEventId = eventId;
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
        'integrations.googleCalendar.lastSync': new Date()
      });

      return results;
    } catch (error) {
      console.error('Error syncing schedules:', error);
      throw new Error('Failed to sync schedules');
    }
  }

  /**
   * Get color ID for shift type
   */
  getColorForShiftType(shiftType) {
    const colors = {
      morning: '2', // Green
      afternoon: '5', // Yellow
      evening: '9', // Blue
      night: '11', // Red
      split: '6', // Orange
      'on-call': '11' // Red
    };
    return colors[shiftType] || '1'; // Default lavender
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar': {
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

export default new GoogleCalendarService();
