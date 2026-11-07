import cron from 'node-cron';
import { LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Order, OrderStatus } from '../entities/Order';
import { sendEmail, emailTemplates } from '../config/email';
import { logger } from '../utils/logger';
import { emitToUser, emitToAdmins } from '../config/socket';
import { Notification, NotificationType } from '../entities/Notification';

// ─── Configuration ────────────────────────────────────────────────────────────

const VENDOR_REMINDER_MINUTES = 10; // Send reminder after 10 minutes
const AUTO_CANCEL_MINUTES = 15; // Auto-cancel after 15 minutes

// ─── Helper: Create and emit notification ────────────────────────────────────

async function createAndEmitNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  referenceId: string
) {
  const notifRepo = AppDataSource.getRepository(Notification);
  const { User: UserEntity } = await import('../entities/User');
  const userRepo = AppDataSource.getRepository(UserEntity);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return;

  const notif = notifRepo.create({ user, title, message, type, referenceId });
  await notifRepo.save(notif);
  emitToUser(userId, 'notification:new', { notification: notif });
  return notif;
}

// ─── Service: Send vendor reminder ────────────────────────────────────────────

export async function sendVendorReminders() {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const reminderThreshold = new Date(Date.now() - VENDOR_REMINDER_MINUTES * 60 * 1000);

    // Find pending orders that need a reminder (10 minutes old, no reminder sent yet)
    const ordersNeedingReminder = await orderRepo.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(reminderThreshold),
        vendorReminderSentAt: null as any, // TypeORM handles null checks
      },
      relations: ['vendor', 'vendor.user', 'user'],
    });

    if (ordersNeedingReminder.length === 0) {
      return { remindersCount: 0 };
    }

    logger.info(`📢 Sending reminders for ${ordersNeedingReminder.length} pending orders`);

    for (const order of ordersNeedingReminder) {
      try {
        // Mark reminder as sent
        order.vendorReminderSentAt = new Date();
        await orderRepo.save(order);

        if (!order.vendor?.user) continue;

        // Send in-app notification
        await createAndEmitNotification(
          order.vendor.user.id,
          '⏰ Order Reminder',
          `Order #${order.orderNumber} is still pending! Please accept or reject it soon to avoid auto-cancellation.`,
          NotificationType.ORDER_REMINDER,
          order.id
        );

        // Send email reminder
        await sendEmail(order.vendor.user.email, {
          subject: `⏰ Urgent: Order #${order.orderNumber} Awaiting Response`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
                  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #FF7A59 0%, #FF5733 100%); color: white; padding: 30px; text-align: center; }
                  .content { padding: 40px 30px; }
                  .alert { background: #FFF6EE; border: 3px solid #FF7A59; padding: 20px; margin: 20px 0; border-radius: 12px; }
                  .button { display: inline-block; background: #5FA36A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                  .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⏰ Order Awaiting Your Response!</h1>
                  </div>
                  <div class="content">
                    <div class="alert">
                      <h2 style="margin: 0 0 10px 0; color: #FF7A59;">Order #${order.orderNumber}</h2>
                      <p style="margin: 0; font-size: 18px; color: #4A2C2A;">
                        <strong>This order has been pending for ${VENDOR_REMINDER_MINUTES} minutes!</strong>
                      </p>
                      <p style="margin: 10px 0 0 0; color: #666;">
                        It will be auto-cancelled in ${AUTO_CANCEL_MINUTES - VENDOR_REMINDER_MINUTES} minutes if you don't respond.
                      </p>
                    </div>
                    <p>Hi <strong>${order.vendor.businessName}</strong>,</p>
                    <p>A customer is waiting for you to accept their order. Please log in to your dashboard and take action:</p>
                    <ul>
                      <li><strong>Accept</strong> the order and start preparing</li>
                      <li><strong>Reject</strong> the order if you can't fulfill it</li>
                    </ul>
                    <a href="${process.env.FRONTEND_URL}/vendor/orders" class="button">View Order Now</a>
                    <p style="color: #999; font-size: 14px; margin-top: 20px;">
                      ⚠️ <strong>Important:</strong> If no action is taken, the order will be automatically cancelled and the customer will be refunded.
                    </p>
                  </div>
                  <div class="footer">
                    <p>Sisters Kitchen Vendor Portal</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          text: `URGENT: Order #${order.orderNumber} has been pending for ${VENDOR_REMINDER_MINUTES} minutes. Please accept or reject it within ${AUTO_CANCEL_MINUTES - VENDOR_REMINDER_MINUTES} minutes to avoid auto-cancellation. View: ${process.env.FRONTEND_URL}/vendor/orders`,
        });

        logger.info(`📧 Reminder sent for order #${order.orderNumber}`);
      } catch (error: any) {
        logger.error(`Failed to send reminder for order ${order.id}:`, error);
      }
    }

    return { remindersCount: ordersNeedingReminder.length };
  } catch (error: any) {
    logger.error('Error in sendVendorReminders:', error);
    return { remindersCount: 0, error: error.message };
  }
}

// ─── Service: Auto-cancel stale orders ────────────────────────────────────────

export async function autoCancelStaleOrders() {
  try {
    const orderRepo = AppDataSource.getRepository(Order);
    const cancelThreshold = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000);

    // Find pending orders older than the cancel threshold
    const staleOrders = await orderRepo.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(cancelThreshold),
      },
      relations: ['vendor', 'vendor.user', 'user', 'items', 'items.product'],
    });

    if (staleOrders.length === 0) {
      return { cancelledCount: 0 };
    }

    logger.warn(`🚫 Auto-cancelling ${staleOrders.length} stale orders`);

    for (const order of staleOrders) {
      try {
        // Update order status
        order.status = OrderStatus.CANCELLED;
        order.rejectionReason = `Vendor did not respond within ${AUTO_CANCEL_MINUTES} minutes. Order automatically cancelled and refunded.`;
        await orderRepo.save(order);

        // Restore stock
        const { restoreOrderStock } = await import('../utils/orderHelpers');
        await restoreOrderStock(order);

        // Notify customer
        if (order.user) {
          await createAndEmitNotification(
            order.user.id,
            'Order Cancelled ❌',
            `Order #${order.orderNumber} was cancelled because the vendor didn't respond in time. You will be refunded shortly.`,
            NotificationType.ORDER_CANCELLED,
            order.id
          );

          await sendEmail(order.user.email, {
            subject: `Order #${order.orderNumber} Cancelled - Refund Issued`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFF6EE; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 40px 30px; }
                    .refund-box { background: #FEF2F2; border: 2px solid #EF4444; padding: 20px; margin: 20px 0; border-radius: 12px; }
                    .button { display: inline-block; background: #FF7A59; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                    .footer { background: #4A2C2A; color: white; padding: 20px; text-align: center; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>❌ Order Cancelled</h1>
                    </div>
                    <div class="content">
                      <p>Hi <strong>${order.user.firstName}</strong>,</p>
                      <p>We're sorry, but your order #${order.orderNumber} has been automatically cancelled.</p>
                      <div class="refund-box">
                        <h3 style="margin: 0 0 10px 0; color: #DC2626;">Why was it cancelled?</h3>
                        <p style="margin: 0; color: #4A2C2A;">The vendor (${order.vendor?.businessName || 'Unknown'}) did not respond to your order within ${AUTO_CANCEL_MINUTES} minutes.</p>
                      </div>
                      <p><strong>💰 Refund Status:</strong> Your payment of ₦${Number(order.total).toLocaleString()} will be refunded to your original payment method within 5-7 business days.</p>
                      <p>We apologize for the inconvenience. Please try ordering from another vendor!</p>
                      <a href="${process.env.FRONTEND_URL}/vendors" class="button">Browse Other Vendors</a>
                    </div>
                    <div class="footer">
                      <p>Sisters Kitchen - We're here to help!</p>
                      <p>Questions? Contact us at support@sisterskitchen.ng</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Order #${order.orderNumber} was cancelled because the vendor didn't respond within ${AUTO_CANCEL_MINUTES} minutes. You will be refunded ₦${Number(order.total).toLocaleString()} within 5-7 business days. Browse other vendors: ${process.env.FRONTEND_URL}/vendors`,
          });
        }

        // Notify vendor (they failed to respond)
        if (order.vendor?.user) {
          await createAndEmitNotification(
            order.vendor.user.id,
            '⚠️ Order Auto-Cancelled',
            `Order #${order.orderNumber} was auto-cancelled due to no response. Please check your notifications settings.`,
            NotificationType.ORDER_CANCELLED,
            order.id
          );
        }

        // Notify admins
        emitToAdmins('order:auto_cancelled', {
          order,
          reason: 'Vendor did not respond in time',
        });

        logger.info(`✅ Auto-cancelled order #${order.orderNumber}`);
      } catch (error: any) {
        logger.error(`Failed to auto-cancel order ${order.id}:`, error);
      }
    }

    return { cancelledCount: staleOrders.length };
  } catch (error: any) {
    logger.error('Error in autoCancelStaleOrders:', error);
    return { cancelledCount: 0, error: error.message };
  }
}

// ─── Cron Job: Run every 5 minutes ───────────────────────────────────────────

export function startOrderTimeoutCron() {
  // Run every 5 minutes: */5 * * * *
  cron.schedule('*/5 * * * *', async () => {
    logger.info('⏰ Running order timeout check...');

    try {
      // Step 1: Send reminders for orders at 10 minutes
      const reminders = await sendVendorReminders();
      if (reminders.remindersCount > 0) {
        logger.info(`📧 Sent ${reminders.remindersCount} vendor reminders`);
      }

      // Step 2: Auto-cancel orders at 15 minutes
      const cancellations = await autoCancelStaleOrders();
      if (cancellations.cancelledCount > 0) {
        logger.warn(`🚫 Auto-cancelled ${cancellations.cancelledCount} stale orders`);
      }

      if (reminders.remindersCount === 0 && cancellations.cancelledCount === 0) {
        logger.info('✅ No pending orders require action');
      }
    } catch (error: any) {
      logger.error('❌ Error in order timeout cron job:', error);
    }
  });

  logger.info('✅ Order timeout cron job started (runs every 5 minutes)');
}

// ─── Manual trigger for testing ──────────────────────────────────────────────

export async function runOrderTimeoutCheckNow() {
  logger.info('🧪 Running manual order timeout check...');

  const reminders = await sendVendorReminders();
  const cancellations = await autoCancelStaleOrders();

  return {
    reminders: reminders.remindersCount,
    cancellations: cancellations.cancelledCount,
  };
}
