import { Resend } from "resend";

/**
 * Email Service using Resend
 *
 * Handles all transactional emails for the client portal:
 * - Magic link authentication
 * - Booking confirmations
 * - Payment receipts
 * - Reminders
 */

let resendInstance: Resend | null = null;

/**
 * Get Resend client instance
 *
 * @returns {Resend} Configured Resend client
 * @throws {Error} If RESEND_API_KEY is not set
 */
export function getResendClient(): Resend {
  if (resendInstance) {
    return resendInstance;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is required for email service"
    );
  }

  resendInstance = new Resend(apiKey);

  return resendInstance;
}

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "Studio Portal <noreply@studio.com>",
  replyTo: process.env.EMAIL_REPLY_TO || "support@studio.com",
};

/**
 * Send magic link email for passwordless authentication
 *
 * @param to - Recipient email
 * @param clientName - Client's name
 * @param magicLink - Magic link URL
 */
export async function sendMagicLinkEmail(
  to: string,
  clientName: string,
  magicLink: string
): Promise<void> {
  const resend = getResendClient();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Magic Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Studio Portal</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${clientName}! 👋</h2>

    <p>Click the button below to sign in to your Studio Portal account. This link will expire in <strong>24 hours</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
        Sign In to Studio Portal
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #555;">
      ${magicLink}
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; margin: 0;">
      If you didn't request this email, you can safely ignore it.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Studio Portal. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: "🔐 Your Studio Portal Sign-In Link",
    html: htmlContent,
    replyTo: EMAIL_CONFIG.replyTo,
  });

  console.log(`[Email] Magic link sent to ${to}`);
}

/**
 * Send booking confirmation email
 *
 * @param to - Recipient email
 * @param clientName - Client's name
 * @param booking - Booking details
 */
export async function sendBookingConfirmationEmail(
  to: string,
  clientName: string,
  booking: {
    id: number;
    title: string;
    roomName: string;
    startTime: Date;
    endTime: Date;
    totalAmount: string;
    depositAmount: string;
  }
): Promise<void> {
  const resend = getResendClient();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${clientName}! 🎉</h2>

    <p>Your booking has been confirmed! We're excited to see you at the studio.</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">📋 Booking Details</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Session:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Room:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.roomName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formatDate(booking.startTime)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Time:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
        </tr>
        <tr style="border-top: 2px solid #e0e0e0;">
          <td style="padding: 8px 0; color: #666;">Total Amount:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 18px; color: #667eea;">$${booking.totalAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Deposit Paid:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #22c55e;">$${booking.depositAmount} ✓</td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">
        <strong>📌 Reminder:</strong> Please arrive 10 minutes early for setup.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
        View Booking Details
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Questions? Reply to this email or contact us at ${EMAIL_CONFIG.replyTo}
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Studio Portal. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `✅ Booking Confirmed - ${booking.title}`,
    html: htmlContent,
    replyTo: EMAIL_CONFIG.replyTo,
  });

  console.log(`[Email] Booking confirmation sent to ${to} for booking ${booking.id}`);
}

/**
 * Send payment receipt email
 *
 * @param to - Recipient email
 * @param clientName - Client's name
 * @param payment - Payment details
 */
export async function sendPaymentReceiptEmail(
  to: string,
  clientName: string,
  payment: {
    id: number;
    bookingTitle: string;
    amount: string;
    paymentType: string; // "deposit" | "balance"
    last4?: string;
    brand?: string;
    paidAt: Date;
  }
): Promise<void> {
  const resend = getResendClient();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  const paymentTypeLabel =
    payment.paymentType === "deposit"
      ? "Deposit Payment"
      : payment.paymentType === "balance"
        ? "Balance Payment"
        : "Payment";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💳 Payment Receipt</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${clientName}! 👋</h2>

    <p>Thank you for your payment! Here's your receipt:</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">📄 Receipt Details</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Receipt #:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">#${payment.id.toString().padStart(6, "0")}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Booking:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${payment.bookingTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Payment Type:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${paymentTypeLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${formatDate(payment.paidAt)}</td>
        </tr>
        ${
          payment.last4 && payment.brand
            ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Payment Method:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${payment.brand} •••• ${payment.last4}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-top: 2px solid #e0e0e0;">
          <td style="padding: 8px 0; color: #666; font-size: 18px;">Amount Paid:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 24px; color: #22c55e;">$${payment.amount}</td>
        </tr>
      </table>
    </div>

    <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534;">
        <strong>✓ Payment Successful</strong><br>
        Your payment has been processed successfully.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Questions about this payment? Reply to this email or contact us at ${EMAIL_CONFIG.replyTo}
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Studio Portal. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `💳 Payment Receipt - $${payment.amount}`,
    html: htmlContent,
    replyTo: EMAIL_CONFIG.replyTo,
  });

  console.log(`[Email] Payment receipt sent to ${to} for payment ${payment.id}`);
}

/**
 * Send booking reminder email (24 hours before session)
 *
 * @param to - Recipient email
 * @param clientName - Client's name
 * @param booking - Booking details
 */
export async function sendBookingReminderEmail(
  to: string,
  clientName: string,
  booking: {
    id: number;
    title: string;
    roomName: string;
    startTime: Date;
    endTime: Date;
  }
): Promise<void> {
  const resend = getResendClient();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Booking Reminder</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hi ${clientName}! 👋</h2>

    <p>This is a friendly reminder that your studio session is coming up <strong>tomorrow</strong>!</p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">📅 Session Details</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Session:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Room:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right;">${booking.roomName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #667eea; font-size: 16px;">${formatDate(booking.startTime)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Time:</td>
          <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 16px;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
        </tr>
      </table>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>💡 Tips for your session:</strong><br>
        • Arrive 10 minutes early<br>
        • Bring your instruments/equipment<br>
        • Have your tracks/files ready
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.CLIENT_PORTAL_URL || "http://localhost:3000"}/bookings/${booking.id}"
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
        View Booking Details
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Need to reschedule? Contact us at ${EMAIL_CONFIG.replyTo}
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Studio Portal. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `⏰ Reminder: Your session is tomorrow!`,
    html: htmlContent,
    replyTo: EMAIL_CONFIG.replyTo,
  });

  console.log(`[Email] Booking reminder sent to ${to} for booking ${booking.id}`);
}
