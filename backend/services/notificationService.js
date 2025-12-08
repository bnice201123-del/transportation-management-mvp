import nodemailer from 'nodemailer';
import twilio from 'twilio';

class NotificationService {
  constructor() {
    // Email setup (Nodemailer)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // SMS setup (Twilio)
    this.twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;
    
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      if (!process.env.EMAIL_USER) {
        console.log('Email not configured, skipping email send');
        return { success: false, reason: 'not_configured' };
      }

      const mailOptions = {
        from: `"Transportation Management" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS({ to, body }) {
    try {
      if (!this.twilioClient) {
        console.log('SMS not configured, skipping SMS send');
        return { success: false, reason: 'not_configured' };
      }

      const message = await this.twilioClient.messages.create({
        body,
        from: this.twilioPhoneNumber,
        to
      });

      console.log('SMS sent:', message.sid);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send shift reminder (both email and SMS)
   */
  async sendShiftReminder(driver, schedule, hoursBeforeShift = 1) {
    const startTime = new Date(schedule.startTime);
    const formattedTime = startTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    // Email content
    const emailHtml = `
      <h2>Shift Reminder</h2>
      <p>Hi ${driver.name},</p>
      <p>This is a reminder that you have an upcoming shift:</p>
      <ul>
        <li><strong>Time:</strong> ${formattedTime}</li>
        <li><strong>Type:</strong> ${schedule.shiftType}</li>
        <li><strong>Location:</strong> ${schedule.location || 'N/A'}</li>
        <li><strong>Vehicle:</strong> ${schedule.vehicle?.vehicleNumber || 'Unassigned'}</li>
      </ul>
      ${schedule.notes ? `<p><strong>Notes:</strong> ${schedule.notes}</p>` : ''}
      <p>Please arrive on time and ready to start your shift.</p>
      <p>Thank you!</p>
    `;

    const emailText = `
      Shift Reminder
      
      Hi ${driver.name},
      
      You have an upcoming shift:
      Time: ${formattedTime}
      Type: ${schedule.shiftType}
      Location: ${schedule.location || 'N/A'}
      Vehicle: ${schedule.vehicle?.vehicleNumber || 'Unassigned'}
      ${schedule.notes ? `\nNotes: ${schedule.notes}` : ''}
      
      Please arrive on time and ready to start your shift.
    `;

    // SMS content (shorter)
    const smsBody = `Shift Reminder: You have a ${schedule.shiftType} shift at ${formattedTime}. Location: ${schedule.location || 'TBD'}`;

    const results = {};

    // Send email if driver has email
    if (driver.email) {
      results.email = await this.sendEmail({
        to: driver.email,
        subject: `Shift Reminder - ${formattedTime}`,
        html: emailHtml,
        text: emailText
      });
    }

    // Send SMS if driver has phone
    if (driver.phone) {
      results.sms = await this.sendSMS({
        to: driver.phone,
        body: smsBody
      });
    }

    return results;
  }

  /**
   * Send time-off approval notification
   */
  async sendTimeOffApproval(driver, timeOffRequest) {
    const startDate = new Date(timeOffRequest.startDate).toLocaleDateString();
    const endDate = new Date(timeOffRequest.endDate).toLocaleDateString();

    const emailHtml = `
      <h2>Time Off Request Approved</h2>
      <p>Hi ${driver.name},</p>
      <p>Your time off request has been approved:</p>
      <ul>
        <li><strong>Type:</strong> ${timeOffRequest.type}</li>
        <li><strong>Dates:</strong> ${startDate} to ${endDate}</li>
        <li><strong>Days:</strong> ${timeOffRequest.totalDays}</li>
      </ul>
      <p>Enjoy your time off!</p>
    `;

    const smsBody = `Your ${timeOffRequest.type} request for ${startDate} to ${endDate} has been approved!`;

    const results = {};

    if (driver.email) {
      results.email = await this.sendEmail({
        to: driver.email,
        subject: 'Time Off Request Approved',
        html: emailHtml,
        text: emailHtml.replace(/<[^>]*>/g, '')
      });
    }

    if (driver.phone) {
      results.sms = await this.sendSMS({
        to: driver.phone,
        body: smsBody
      });
    }

    return results;
  }

  /**
   * Send time-off denial notification
   */
  async sendTimeOffDenial(driver, timeOffRequest, reason) {
    const startDate = new Date(timeOffRequest.startDate).toLocaleDateString();
    const endDate = new Date(timeOffRequest.endDate).toLocaleDateString();

    const emailHtml = `
      <h2>Time Off Request Denied</h2>
      <p>Hi ${driver.name},</p>
      <p>Unfortunately, your time off request has been denied:</p>
      <ul>
        <li><strong>Type:</strong> ${timeOffRequest.type}</li>
        <li><strong>Dates:</strong> ${startDate} to ${endDate}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <p>Please contact your manager if you have questions.</p>
    `;

    const smsBody = `Your time off request for ${startDate} to ${endDate} was denied. Reason: ${reason}`;

    const results = {};

    if (driver.email) {
      results.email = await this.sendEmail({
        to: driver.email,
        subject: 'Time Off Request Update',
        html: emailHtml,
        text: emailHtml.replace(/<[^>]*>/g, '')
      });
    }

    if (driver.phone) {
      results.sms = await this.sendSMS({
        to: driver.phone,
        body: smsBody
      });
    }

    return results;
  }

  /**
   * Send shift swap notification to target driver
   */
  async sendShiftSwapRequest(targetDriver, requestingDriver, shiftSwap) {
    const startTime = new Date(shiftSwap.originalShift.startTime).toLocaleString();

    const emailHtml = `
      <h2>Shift Swap Request</h2>
      <p>Hi ${targetDriver.name},</p>
      <p>${requestingDriver.name} would like to swap shifts with you:</p>
      <ul>
        <li><strong>Original Shift:</strong> ${startTime}</li>
        <li><strong>Type:</strong> ${shiftSwap.swapType}</li>
      </ul>
      <p>Please log in to the system to accept or decline this request.</p>
    `;

    const smsBody = `${requestingDriver.name} wants to swap shifts with you. Check the app for details.`;

    const results = {};

    if (targetDriver.email) {
      results.email = await this.sendEmail({
        to: targetDriver.email,
        subject: 'Shift Swap Request',
        html: emailHtml,
        text: emailHtml.replace(/<[^>]*>/g, '')
      });
    }

    if (targetDriver.phone) {
      results.sms = await this.sendSMS({
        to: targetDriver.phone,
        body: smsBody
      });
    }

    return results;
  }

  /**
   * Send overtime alert to admin
   */
  async sendOvertimeAlert(admin, driver, schedule) {
    const emailHtml = `
      <h2>Overtime Alert</h2>
      <p>Hi ${admin.name},</p>
      <p>Driver ${driver.name} has logged overtime hours:</p>
      <ul>
        <li><strong>Shift Date:</strong> ${new Date(schedule.startTime).toLocaleDateString()}</li>
        <li><strong>Total Hours:</strong> ${schedule.totalHours}</li>
        <li><strong>Overtime Hours:</strong> ${schedule.overtimeHours}</li>
      </ul>
      <p>Please review the shift details in the system.</p>
    `;

    if (admin.email) {
      return await this.sendEmail({
        to: admin.email,
        subject: `Overtime Alert - ${driver.name}`,
        html: emailHtml,
        text: emailHtml.replace(/<[^>]*>/g, '')
      });
    }

    return { success: false, reason: 'no_email' };
  }

  /**
   * Send coverage gap alert to admin
   */
  async sendCoverageGapAlert(admin, gaps) {
    const gapsList = gaps.map(gap => 
      `${new Date(gap.startTime).toLocaleString()} - ${gap.neededDrivers} drivers needed`
    ).join('\n');

    const emailHtml = `
      <h2>Coverage Gap Alert</h2>
      <p>Hi ${admin.name},</p>
      <p>The following time periods have insufficient driver coverage:</p>
      <pre>${gapsList}</pre>
      <p>Please assign additional drivers to these shifts.</p>
    `;

    if (admin.email) {
      return await this.sendEmail({
        to: admin.email,
        subject: 'Coverage Gap Alert',
        html: emailHtml,
        text: emailHtml.replace(/<[^>]*>/g, '')
      });
    }

    return { success: false, reason: 'no_email' };
  }

  /**
   * Test email configuration
   */
  async testEmail(toEmail) {
    return await this.sendEmail({
      to: toEmail,
      subject: 'Test Email - Transportation Management',
      html: '<h2>Test Email</h2><p>Your email configuration is working correctly!</p>',
      text: 'Test Email\n\nYour email configuration is working correctly!'
    });
  }

  /**
   * Test SMS configuration
   */
  async testSMS(toPhone) {
    return await this.sendSMS({
      to: toPhone,
      body: 'Test SMS from Transportation Management - Your SMS configuration is working!'
    });
  }
}

export default new NotificationService();
