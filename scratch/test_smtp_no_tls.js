import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testConnection() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    });

    console.log('Verifying connection without bypass...');
    await transporter.verify();
    console.log('Connection verified successfully!');

    console.log('Sending test mail...');
    const info = await transporter.sendMail({
      from: `"PrintFlow Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'PrintFlow SMTP Verification (No Bypass)',
      text: 'SMTP connection test succeeded without bypass!',
    });
    console.log('Message sent: %s', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('Verification failed without bypass:', error);
    process.exit(1);
  }
}

testConnection();
