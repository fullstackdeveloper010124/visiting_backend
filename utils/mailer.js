import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createSmtpTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } catch (err) {
    console.error('[MAILER] Failed to create SMTP transporter:', err);
    return null;
  }
};

const sendMailWithSmtp = async (mailOptions) => {
  const transporter = createSmtpTransporter();
  if (!transporter) {
    console.log('[MAILER] No SMTP credentials configured. Email logged to file.');
    return;
  }

  void transporter.verify().then(() => {
    console.log('[MAILER] SMTP transporter verified successfully.');
  }).catch((verifyErr) => {
    console.error('[MAILER] SMTP transporter verification failed:', verifyErr);
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[MAILER] Email successfully sent to ${mailOptions.to}`);
  } catch (err) {
    console.error('[MAILER] SMTP send failed:', err);
  }
};

export const sendApprovalEmail = async (toEmail, approvalId, designDetails) => {
  const defaultFrontendUrl = process.env.NODE_ENV === 'production'
    ? 'https://visiting-frontend.onrender.com'
    : 'http://localhost:5173';
  const frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
  const approvalUrl = `${frontendUrl}/approve-card-design/${approvalId}`;
  const emailTextWithButton = `
********************************************************************************
👉 ACTION REQUIRED: APPROVE YOUR PRINTFLOW CARD DESIGN 👈
********************************************************************************

Hello,

You have requested approval for your customized card design at PrintFlow.
Please click the direct link below to view, verify, and approve your design:

➡️ CLICK HERE TO APPROVE: ${approvalUrl}

(Note: Once approved, you will be prompted to enter your shipping address and complete payment details.)

Thank you,
The PrintFlow Team
********************************************************************************
`;

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 600px; margin: auto; border: 2px solid #2563eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 26px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px;">PrintFlow Studio</span>
      </div>
      <h2 style="color: #1e3a8a; text-align: center; margin-top: 0; font-size: 20px; font-weight: 700;">Design Approval Required</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        Hello! You have requested approval for your customized card design at PrintFlow. Please click the button below to view and approve your layout:
      </p>
      
      <div style="margin: 35px 0; text-align: center;">
        <a href="${approvalUrl}" style="background-color: #10b981; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3); display: inline-block; border: 1px solid #059669; transition: all 0.2s ease;">
          👉 CLICK HERE TO APPROVE DESIGN 👈
        </a>
      </div>

      <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; margin-top: 30px;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-weight: bold; uppercase tracking-wider;">If the button above does not work, copy & paste this link:</p>
        <p style="margin: 0; font-size: 13px; word-break: break-all; color: #2563eb; font-family: monospace;">
          <a href="${approvalUrl}" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${approvalUrl}</a>
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        This is an automated request from the PrintFlow Design Team. Please do not reply directly to this email.
      </p>
    </div>
  `;

  // Always write to email-log.txt for easy local testing
  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const logEntry = `
=========================================
Timestamp: ${new Date().toISOString()}
To: ${toEmail}
Subject: Action Required: Approve Your PrintFlow Card Design
Approval URL: ${approvalUrl}
-----------------------------------------
${emailTextWithButton}
=========================================
`;

  // Write to email-log.html so the developer/user can open it in a browser to see the real button
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');
  const htmlLogEntry = `
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Action Required: Approve Your PrintFlow Card Design
  </div>
  ${emailHtml}
</div>
`;

  const logPromise = fs.promises.appendFile(logFilePath, logEntry)
    .then(() => console.log(`[MAILER] Email text logged successfully to ${logFilePath}`))
    .catch((err) => ({ type: 'logError', error: err }));

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlLogEntry)
    .then(() => console.log(`[MAILER] Email HTML logged successfully to ${htmlLogFilePath}`))
    .catch((err) => ({ type: 'htmlLogError', error: err }));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Team" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Action Required: Approve Your PrintFlow Card Design',
    text: emailTextWithButton,
    html: emailHtml,
  }).catch((err) => ({ type: 'smtpError', error: err }));

  // Wait for all logging/smtp attempts to settle so callers can observe failures.
  const results = await Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
  results.forEach((r) => {
    if (r.status === 'rejected') {
      console.error('[MAILER] Unexpected rejection while sending approval email:', r.reason);
    } else if (r.value && r.value.type && r.value.error) {
      console.error(`[MAILER] ${r.value.type}:`, r.value.error);
    }
  });

  return approvalUrl;
};

export const sendAccountApprovedEmail = async (toEmail, fullName) => {
  const emailText = `
Hello ${fullName},

Great news! Your PrintFlow account has been accepted and activated.
You can now log in and begin using your account immediately.

If you need any help, reply to this email and our support team will assist you.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #10b981;">Your PrintFlow Account Has Been Accepted</h2>
      <p>Hi ${fullName},</p>
      <p>We’re pleased to let you know that your account has been accepted and is now active.</p>
      <p>You can log in now to start customizing print designs, managing your orders, and using PrintFlow.</p>
      <p>If you need help, just reply to this email.</p>
      <br/>
      <p>Best regards,<br/>The PrintFlow Team</p>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[ACCOUNT APPROVAL EMAIL] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write account approval text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Your PrintFlow Account Has Been Accepted
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write account approval HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Team" <${process.env.SMTP_USER || 'admin@printflow.com'}>`,
    to: toEmail,
    subject: 'Your PrintFlow Account Has Been Accepted',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendApprovalConfirmationEmail = async (toEmail, approvalId, designType) => {
  const emailText = `
Hello,

Your card design (${designType}) with ID: ${approvalId} has been successfully approved!
You can now proceed to place your order on our platform.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #10b981;">Design Approved!</h2>
      <p>Your custom design (${designType}) has been successfully approved.</p>
      <p>Log in to complete your checkout and place your order.</p>
      <br/>
      <p>Best regards,<br/>The PrintFlow Team</p>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[APPROVAL CONFIRMATION] Sent to ${toEmail}\n${emailText}\n`)
    .then(() => console.log(`[MAILER] Approval confirmation email text logged to ${logFilePath}`))
    .catch((err) => console.error('[MAILER] Failed to write approval confirmation email log:', err));

  const htmlEntry = `
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Your PrintFlow Design Has Been Approved!
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .then(() => console.log(`[MAILER] Approval confirmation email HTML logged successfully to ${htmlLogFilePath}`))
    .catch((err) => console.error('[MAILER] Failed to write approval confirmation HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Team" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your PrintFlow Design Has Been Approved!',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendPendingApprovalEmail = async (toEmail, fullName) => {
  const emailText = `
Hello ${fullName},

Thank you for registering at PrintFlow!
Your account has been created successfully and is currently pending approval by the Admin.
You will receive another email once your account has been approved and activated.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #d97706;">Registration Received</h2>
      <p>Hello ${fullName},</p>
      <p>Your account has been created successfully and is currently pending approval by the Admin.</p>
      <p>You will receive an email confirmation once your account has been activated.</p>
      <br/>
      <p>Best regards,<br/>The PrintFlow Team</p>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[PENDING APPROVAL EMAIL] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write pending approval text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #d97706; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: PrintFlow Registration - Pending Approval
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write pending approval HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Team" <${process.env.SMTP_USER || 'admin@printflow.com'}>`,
    to: toEmail,
    subject: 'PrintFlow Registration - Pending Approval',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendWelcomeEmail = async (toEmail, fullName) => {
  const emailText = `
Hello ${fullName},

Welcome to PrintFlow!
Your account has been approved and activated.
You can now log in and start using the platform immediately.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #10b981;">Welcome to PrintFlow</h2>
      <p>Hi ${fullName},</p>
      <p>Your account has been approved and activated.</p>
      <p>You can now log in and start using PrintFlow.</p>
      <br/>
      <p>Best regards,<br/>The PrintFlow Team</p>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[WELCOME EMAIL] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write welcome text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Welcome to PrintFlow!
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write welcome HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Team" <${process.env.SMTP_USER || 'admin@printflow.com'}>`,
    to: toEmail,
    subject: 'Welcome to PrintFlow!',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendInvoiceEmail = async (toEmail, invoiceDetails) => {
  const emailText = `
Hello,

Please find the details of your PrintFlow invoice below:

Invoice Number: ${invoiceDetails.invoiceNumber}
Order Number: ${invoiceDetails.orderNumber}
Issue Date: ${invoiceDetails.issueDate}
Due Date: ${invoiceDetails.dueDate}
Total Amount: $${invoiceDetails.amount.toFixed(2)}
Payment Status: ${invoiceDetails.status.toUpperCase()}

If you have any questions, please contact our support team.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 25px; border: 2px solid #3b82f6; border-radius: 12px; max-width: 550px; margin: auto; background-color: #ffffff;">
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">PrintFlow Portal - Invoice Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Invoice Number:</td>
          <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${invoiceDetails.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Order Number:</td>
          <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${invoiceDetails.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Issue Date:</td>
          <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${invoiceDetails.issueDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Due Date:</td>
          <td style="padding: 6px 0; color: #1e293b; font-size: 14px;">${invoiceDetails.dueDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Amount:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #1e3a8a; font-size: 15px;">$${invoiceDetails.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Status:</td>
          <td style="padding: 6px 0; font-size: 14px;">
            <span style="background-color: ${invoiceDetails.status === 'paid' ? '#def7ec' : '#fde8e8'}; color: ${invoiceDetails.status === 'paid' ? '#03543f' : '#9b1c1c'}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">
              ${invoiceDetails.status.toUpperCase()}
            </span>
          </td>
        </tr>
      </table>
      <div style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 12px; color: #6b7280; margin: 0;">Thank you for your business!</p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 5px;">PrintFlow printing and design hub.</p>
      </div>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[INVOICE EMAIL] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write invoice text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #3b82f6; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Invoice Details: ${invoiceDetails.invoiceNumber}
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write invoice HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Accounting" <${process.env.SMTP_USER || 'accounting@printflow.com'}>`,
    to: toEmail,
    subject: `Invoice Details: ${invoiceDetails.invoiceNumber}`,
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendLoginEmail = async (toEmail, fullName) => {
  const emailText = `
Hello ${fullName},

We noticed a successful login to your PrintFlow account just now.
If this was you, no further action is needed.

If you did not authorize this login, please contact support immediately.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px; margin: auto;">
      <h2 style="color: #3b82f6;">New Login Alert</h2>
      <p>Hi ${fullName},</p>
      <p>We noticed a successful login to your PrintFlow account just now.</p>
      <p>If this was you, no further action is needed.</p>
      <p>If you did not authorize this login, please contact support immediately.</p>
      <br/>
      <p>Best regards,<br/>The PrintFlow Team</p>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[LOGIN ALERT] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write login alert text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #3b82f6; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Security Alert: New Login to Your Account
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write login alert HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Security" <${process.env.SMTP_USER || 'security@printflow.com'}>`,
    to: toEmail,
    subject: 'Security Alert: New Login to Your Account',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

export const sendOrderConfirmationEmail = async (toEmail, fullName, orderDetails) => {
  const emailText = `
Hello ${fullName},

Thank you for your order!
Your order ${orderDetails.orderNumber} has been placed successfully.

Total Amount: $${orderDetails.total.toFixed(2)}

You can view your order details by logging into your account.

Best regards,
The PrintFlow Team
`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 25px; border: 2px solid #10b981; border-radius: 12px; max-width: 550px; margin: auto; background-color: #ffffff;">
      <h2 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Order Confirmation</h2>
      <p>Hi ${fullName},</p>
      <p>Thank you for your order! Your order <strong>${orderDetails.orderNumber}</strong> has been placed successfully.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #4b5563; font-size: 14px;">Total Amount:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #059669; font-size: 15px;">$${orderDetails.total.toFixed(2)}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">You can view your full order details by logging into your account.</p>
      <div style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin-top: 5px;">PrintFlow printing and design hub.</p>
      </div>
    </div>
  `;

  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, `\n[ORDER CONFIRMATION] Sent to ${toEmail}\n${emailText}\n`)
    .catch((err) => console.error('[MAILER] Failed to write order confirmation text log:', err));

  const htmlEntry = `
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: ${new Date().toISOString()} | To: ${toEmail} | Subject: Order Confirmation: ${orderDetails.orderNumber}
  </div>
  ${emailHtml}
</div>
`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write order confirmation HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: `"PrintFlow Orders" <${process.env.SMTP_USER || 'orders@printflow.com'}>`,
    to: toEmail,
    subject: `Order Confirmation: ${orderDetails.orderNumber}`,
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
};

