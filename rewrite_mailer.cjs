const fs = require('fs');

let content = fs.readFileSync('utils/mailer.js', 'utf8');

// Refactor sendAccountApprovedEmail
content = content.replace(
  /  \/\/ Log locally[\s\S]*?console\.error\('\[MAILER\] Failed to send account approval email:', err\);\n    }\n  }\n/m,
`  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, \`\\n[ACCOUNT APPROVAL EMAIL] Sent to \${toEmail}\\n\${emailText}\\n\`)
    .catch((err) => console.error('[MAILER] Failed to write account approval text log:', err));

  const htmlEntry = \`
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: \${new Date().toISOString()} | To: \${toEmail} | Subject: Your PrintFlow Account Has Been Accepted
  </div>
  \${emailHtml}
</div>
\`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write account approval HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: \`"PrintFlow Team" <\${process.env.SMTP_USER || 'admin@printflow.com'}>\`,
    to: toEmail,
    subject: 'Your PrintFlow Account Has Been Accepted',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
`
);

// Refactor sendPendingApprovalEmail
content = content.replace(
  /  \/\/ Log locally\n  const logFilePath = path\.join\(__dirname, '\.\.', 'email-log\.txt'\);\n  fs\.appendFileSync\(logFilePath, `\\n\[PENDING APPROVAL EMAIL\] Sent to \${toEmail}\\n\${emailText}\\n`\);[\s\S]*?console\.error\('\[MAILER\] Failed to send pending approval email:', err\);\n    }\n  }\n/m,
`  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, \`\\n[PENDING APPROVAL EMAIL] Sent to \${toEmail}\\n\${emailText}\\n\`)
    .catch((err) => console.error('[MAILER] Failed to write pending approval text log:', err));

  const htmlEntry = \`
<div style="border: 2px solid #d97706; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: \${new Date().toISOString()} | To: \${toEmail} | Subject: PrintFlow Registration - Pending Approval
  </div>
  \${emailHtml}
</div>
\`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write pending approval HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: \`"PrintFlow Team" <\${process.env.SMTP_USER || 'admin@printflow.com'}>\`,
    to: toEmail,
    subject: 'PrintFlow Registration - Pending Approval',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
`
);


// Refactor sendWelcomeEmail
content = content.replace(
  /  const logFilePath = path\.join\(__dirname, '\.\.', 'email-log\.txt'\);\n  fs\.appendFileSync\(logFilePath, `\\n\[WELCOME EMAIL\] Sent to \${toEmail}\\n\${emailText}\\n`\);[\s\S]*?console\.error\('\[MAILER\] Failed to send welcome email:', err\);\n    }\n  }\n/m,
`  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, \`\\n[WELCOME EMAIL] Sent to \${toEmail}\\n\${emailText}\\n\`)
    .catch((err) => console.error('[MAILER] Failed to write welcome text log:', err));

  const htmlEntry = \`
<div style="border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: \${new Date().toISOString()} | To: \${toEmail} | Subject: Welcome to PrintFlow!
  </div>
  \${emailHtml}
</div>
\`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write welcome HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: \`"PrintFlow Team" <\${process.env.SMTP_USER || 'admin@printflow.com'}>\`,
    to: toEmail,
    subject: 'Welcome to PrintFlow!',
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
`
);


// Refactor sendInvoiceEmail
content = content.replace(
  /  \/\/ Log locally\n  const logFilePath = path\.join\(__dirname, '\.\.', 'email-log\.txt'\);\n  fs\.appendFileSync\(logFilePath, `\\n\[INVOICE EMAIL\] Sent to \${toEmail}\\n\${emailText}\\n`\);[\s\S]*?console\.error\('\[MAILER\] Failed to send invoice email:', err\);\n    }\n  }\n/m,
`  const logFilePath = path.join(__dirname, '..', 'email-log.txt');
  const htmlLogFilePath = path.join(__dirname, '..', 'email-log.html');

  const logPromise = fs.promises.appendFile(logFilePath, \`\\n[INVOICE EMAIL] Sent to \${toEmail}\\n\${emailText}\\n\`)
    .catch((err) => console.error('[MAILER] Failed to write invoice text log:', err));

  const htmlEntry = \`
<div style="border: 2px solid #3b82f6; border-radius: 8px; margin-bottom: 20px; padding: 15px; background-color: #f8fafc; font-family: sans-serif;">
  <div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-size: 13px;">
    Timestamp: \${new Date().toISOString()} | To: \${toEmail} | Subject: Invoice Details: \${invoiceDetails.invoiceNumber}
  </div>
  \${emailHtml}
</div>
\`;

  const htmlLogPromise = fs.promises.appendFile(htmlLogFilePath, htmlEntry)
    .catch((err) => console.error('[MAILER] Failed to write invoice HTML log:', err));

  const smtpPromise = sendMailWithSmtp({
    from: \`"PrintFlow Accounting" <\${process.env.SMTP_USER || 'accounting@printflow.com'}>\`,
    to: toEmail,
    subject: \`Invoice Details: \${invoiceDetails.invoiceNumber}\`,
    text: emailText,
    html: emailHtml,
  });

  void Promise.allSettled([logPromise, htmlLogPromise, smtpPromise]);
`
);

fs.writeFileSync('utils/mailer.js', content);
console.log('mailer.js refactored successfully.');
