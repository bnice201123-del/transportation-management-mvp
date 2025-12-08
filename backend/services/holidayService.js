import axios from 'axios';
import mongoose from 'mongoose';

// Holiday model schema
const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  country: { type: String, default: 'US' },
  region: { type: String }, // State or region
  type: { 
    type: String, 
    enum: ['public', 'federal', 'state', 'religious', 'observance', 'custom'],
    default: 'public'
  },
  isBlackoutPeriod: { type: Boolean, default: false }, // Block time-off requests
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

holidaySchema.index({ country: 1, date: 1 });
holidaySchema.index({ region: 1, date: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);

class HolidayService {
  constructor() {
    this.apiKey = process.env.CALENDARIFIC_API_KEY; // https://calendarific.com/
    this.apiUrl = 'https://calendarific.com/api/v2/holidays';
  }

  /**
   * Import holidays from Calendarific API
   * Alternative free API: https://date.nager.at/Api
   */
  async importHolidaysFromAPI(country = 'US', year = new Date().getFullYear(), region = null) {
    try {
      let holidays = [];

      if (this.apiKey) {
        // Use Calendarific if API key is available
        const response = await axios.get(this.apiUrl, {
          params: {
            api_key: this.apiKey,
            country,
            year,
            type: 'national,local'
          }
        });

        holidays = response.data.response.holidays.map(h => ({
          name: h.name,
          date: new Date(h.date.iso),
          country: h.country.id,
          region: h.locations ? h.locations.join(', ') : null,
          type: this.mapHolidayType(h.type),
          description: h.description
        }));
      } else {
        // Use free alternative API (Nager.Date)
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);

        holidays = response.data.map(h => ({
          name: h.name,
          date: new Date(h.date),
          country,
          region: h.counties && h.counties.length > 0 ? h.counties.join(', ') : null,
          type: h.global ? 'federal' : 'state',
          description: h.localName !== h.name ? h.localName : null
        }));
      }

      // Filter by region if specified
      if (region) {
        holidays = holidays.filter(h => 
          !h.region || h.region.includes(region)
        );
      }

      return holidays;
    } catch (error) {
      console.error('Error fetching holidays from API:', error.response?.data || error.message);
      throw new Error('Failed to fetch holidays from external API');
    }
  }

  /**
   * Import and save holidays to database
   */
  async importAndSaveHolidays(country = 'US', year = new Date().getFullYear(), region = null, createdBy = null) {
    try {
      const holidays = await this.importHolidaysFromAPI(country, year, region);

      const results = {
        imported: 0,
        skipped: 0,
        failed: 0
      };

      for (const holidayData of holidays) {
        try {
          // Check if holiday already exists
          const existing = await Holiday.findOne({
            name: holidayData.name,
            date: holidayData.date,
            country: holidayData.country
          });

          if (existing) {
            results.skipped++;
            continue;
          }

          // Create new holiday
          await Holiday.create({
            ...holidayData,
            createdBy
          });

          results.imported++;
        } catch (error) {
          console.error('Error saving holiday:', error);
          results.failed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error importing holidays:', error);
      throw error;
    }
  }

  /**
   * Get US Federal Holidays (hardcoded fallback)
   */
  getUSFederalHolidays(year = new Date().getFullYear()) {
    return [
      { name: "New Year's Day", date: new Date(year, 0, 1), type: 'federal' },
      { name: "Martin Luther King Jr. Day", date: this.getNthDayOfMonth(year, 0, 1, 3), type: 'federal' },
      { name: "Presidents' Day", date: this.getNthDayOfMonth(year, 1, 1, 3), type: 'federal' },
      { name: "Memorial Day", date: this.getLastDayOfMonth(year, 4, 1), type: 'federal' },
      { name: "Juneteenth", date: new Date(year, 5, 19), type: 'federal' },
      { name: "Independence Day", date: new Date(year, 6, 4), type: 'federal' },
      { name: "Labor Day", date: this.getNthDayOfMonth(year, 8, 1, 1), type: 'federal' },
      { name: "Columbus Day", date: this.getNthDayOfMonth(year, 9, 1, 2), type: 'federal' },
      { name: "Veterans Day", date: new Date(year, 10, 11), type: 'federal' },
      { name: "Thanksgiving", date: this.getNthDayOfMonth(year, 10, 4, 4), type: 'federal' },
      { name: "Christmas Day", date: new Date(year, 11, 25), type: 'federal' }
    ];
  }

  /**
   * Import US Federal Holidays as fallback
   */
  async importUSFederalHolidays(year = new Date().getFullYear(), createdBy = null) {
    const holidays = this.getUSFederalHolidays(year);

    const results = {
      imported: 0,
      skipped: 0,
      failed: 0
    };

    for (const holidayData of holidays) {
      try {
        const existing = await Holiday.findOne({
          name: holidayData.name,
          date: holidayData.date,
          country: 'US'
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await Holiday.create({
          ...holidayData,
          country: 'US',
          createdBy
        });

        results.imported++;
      } catch (error) {
        console.error('Error saving federal holiday:', error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get holidays for date range
   */
  async getHolidays(startDate, endDate, country = null, region = null) {
    const query = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (country) query.country = country;
    if (region) query.region = { $regex: region, $options: 'i' };

    return await Holiday.find(query).sort({ date: 1 });
  }

  /**
   * Check if date is a holiday
   */
  async isHoliday(date, country = 'US', region = null) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay },
      country
    };

    if (region) query.region = { $regex: region, $options: 'i' };

    const holiday = await Holiday.findOne(query);
    return holiday ? { isHoliday: true, holiday } : { isHoliday: false };
  }

  /**
   * Check if date is in blackout period
   */
  async isBlackoutPeriod(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const blackoutHoliday = await Holiday.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      isBlackoutPeriod: true
    });

    return !!blackoutHoliday;
  }

  /**
   * Create custom holiday
   */
  async createCustomHoliday(holidayData, createdBy) {
    try {
      const holiday = await Holiday.create({
        ...holidayData,
        type: 'custom',
        createdBy
      });
      return holiday;
    } catch (error) {
      console.error('Error creating custom holiday:', error);
      throw new Error('Failed to create custom holiday');
    }
  }

  /**
   * Update holiday
   */
  async updateHoliday(holidayId, updates) {
    try {
      const holiday = await Holiday.findByIdAndUpdate(
        holidayId,
        updates,
        { new: true, runValidators: true }
      );
      return holiday;
    } catch (error) {
      console.error('Error updating holiday:', error);
      throw new Error('Failed to update holiday');
    }
  }

  /**
   * Delete holiday
   */
  async deleteHoliday(holidayId) {
    try {
      await Holiday.findByIdAndDelete(holidayId);
      return true;
    } catch (error) {
      console.error('Error deleting holiday:', error);
      throw new Error('Failed to delete holiday');
    }
  }

  /**
   * Set blackout period for holiday
   */
  async setBlackoutPeriod(holidayId, isBlackout = true) {
    return await this.updateHoliday(holidayId, { isBlackoutPeriod: isBlackout });
  }

  /**
   * Helper: Get nth day of month (e.g., 3rd Monday)
   */
  getNthDayOfMonth(year, month, dayOfWeek, n) {
    const date = new Date(year, month, 1);
    let count = 0;

    while (count < n) {
      if (date.getDay() === dayOfWeek) {
        count++;
        if (count === n) return new Date(date);
      }
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  /**
   * Helper: Get last day of month (e.g., last Monday)
   */
  getLastDayOfMonth(year, month, dayOfWeek) {
    const date = new Date(year, month + 1, 0); // Last day of month
    
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() - 1);
    }

    return new Date(date);
  }

  /**
   * Map API holiday type to our type
   */
  mapHolidayType(apiType) {
    const typeMap = {
      'National holiday': 'federal',
      'Local holiday': 'state',
      'Observance': 'observance',
      'Season': 'observance',
      'Clock change/Daylight Saving Time': 'observance'
    };

    return typeMap[apiType] || 'public';
  }
}

export { Holiday };
export default new HolidayService();
