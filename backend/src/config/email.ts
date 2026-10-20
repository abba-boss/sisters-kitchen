import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Email transporter configuration
export const createEmailTransporter = () => {
  // Use different transports based on environment
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    // Production: Use actual SMTP service (e.g., SendGrid, Gmail, AWS SES)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal Email (test email service)
    // Emails can be viewed at https://ethereal.email
    logger.info('📧 Using development email transport (Ethereal)');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'test',
      },
    });
  }
};

export const emailTransporter = createEmailTransporter();

// Email templates
export const emailTemplates = {
  orderConfirmation: (orderNumber: string, customerName: string, total: number) => ({
    subject: `Order Confirmed - #${orderNumber} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF7A59 0%, #FF9478 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .order-number { background: #FFF6EE; border-left: 4px solid #FF7A59; padding: 15px 20px; margin: 20px 0; font-size: 18px; font-weight: bold; color: #4A2C2A; }
            .total { font-size: 24px; color: #FF7A59; font-weight: bold; margin: 20px 0; }
            .button { display: inline-block; background: #FF7A59; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .emoji { font-size: 40px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <div class="emoji">🍽️</div>
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Great news! Your order has been confirmed and is being prepared with love by our talented vendors.</p>
              <div class="order-number">
                Order Number: #${orderNumber}
              </div>
              <div class="total">
                Total: ₦${total.toLocaleString()}
              </div>
              <p>You'll receive real-time updates as your order progresses:</p>
              <ul>
                <li>✅ Confirmed</li>
                <li>👩‍🍳 Being Prepared</li>
                <li>📦 Ready for Delivery/Pickup</li>
                <li>🚚 Out for Delivery (if applicable)</li>
                <li>✨ Delivered</li>
              </ul>
              <a href="${process.env.FRONTEND_URL}/orders" class="button">Track Your Order</a>
            </div>
            <div class="footer">
              <p>Sisters Kitchen - Homemade Meals, Made with Love</p>
              <p>Questions? Contact us at support@sisterskitchen.ng</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${customerName}, your order #${orderNumber} has been confirmed! Total: ₦${total.toLocaleString()}. Track your order at ${process.env.FRONTEND_URL}/orders`,
  }),

  orderStatusUpdate: (orderNumber: string, customerName: string, status: string, message: string) => ({
    subject: `Order Update - #${orderNumber} ${getStatusEmoji(status)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF7A59 0%, #FF9478 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; text-align: center; }
            .status { font-size: 48px; margin: 20px 0; }
            .message { font-size: 18px; color: #4A2C2A; margin: 20px 0; line-height: 1.6; }
            .button { display: inline-block; background: #FF7A59; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order #${orderNumber}</h1>
            </div>
            <div class="content">
              <div class="status">${getStatusEmoji(status)}</div>
              <h2>${formatStatus(status)}</h2>
              <p class="message">${message}</p>
              <a href="${process.env.FRONTEND_URL}/orders/${orderNumber}" class="button">View Order Details</a>
            </div>
            <div class="footer">
              <p>Sisters Kitchen - Homemade Meals, Made with Love</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Order #${orderNumber} update: ${message}`,
  }),

  newOrderVendor: (orderNumber: string, vendorName: string, itemCount: number, total: number) => ({
    subject: `New Order Received! #${orderNumber} 🛎️`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #5FA36A 0%, #7DB88A 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .alert { background: #FFF6EE; border: 2px solid #FF7A59; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .button { display: inline-block; background: #5FA36A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛎️ New Order Alert!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${vendorName}</strong>,</p>
              <div class="alert">
                <h2 style="margin: 0 0 10px 0;">Order #${orderNumber}</h2>
                <p style="margin: 0;">You have a new order waiting to be confirmed!</p>
              </div>
              <div class="details">
                <div class="detail-row">
                  <span>Items:</span>
                  <strong>${itemCount} item(s)</strong>
                </div>
                <div class="detail-row">
                  <span>Total:</span>
                  <strong>₦${total.toLocaleString()}</strong>
                </div>
              </div>
              <p><strong>Action Required:</strong> Please log in to your vendor dashboard to confirm and prepare this order.</p>
              <a href="${process.env.FRONTEND_URL}/vendor/orders" class="button">View Order Details</a>
            </div>
            <div class="footer">
              <p>Sisters Kitchen Vendor Portal</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `New order #${orderNumber}! ${itemCount} items, ₦${total.toLocaleString()}. Check your vendor dashboard: ${process.env.FRONTEND_URL}/vendor/orders`,
  }),

  passwordReset: (resetToken: string, userName: string) => ({
    subject: 'Reset Your Password - Sisters Kitchen',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF7A59 0%, #FF9478 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #FF7A59; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .warning { background: #FFF6EE; border-left: 4px solid #FF7A59; padding: 15px; margin: 20px 0; }
            .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support.
              </div>
            </div>
            <div class="footer">
              <p>Sisters Kitchen - Security Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
  }),
};

// Helper functions
function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    confirmed: '✅',
    preparing: '👩‍🍳',
    ready: '📦',
    out_for_delivery: '🚚',
    delivered: '🎉',
    cancelled: '❌',
  };
  return emojiMap[status] || '📬';
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    confirmed: 'Order Confirmed',
    preparing: 'Being Prepared',
    ready: 'Ready for Delivery/Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered Successfully',
    cancelled: 'Order Cancelled',
  };
  return statusMap[status] || status;
}

// Send email function with error handling
export const sendEmail = async (to: string, template: { subject: string; html: string; text: string }) => {
  try {
    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || '"Sisters Kitchen" <noreply@sisterskitchen.ng>',
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    logger.info(`📧 Email sent: ${info.messageId} to ${to}`);
    
    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('📧 Email sending failed:', error);
    // Don't throw - email failures shouldn't break the app
    return { success: false, error: error.message };
  }
};
