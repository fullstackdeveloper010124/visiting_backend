import dotenv from 'dotenv';
dotenv.config();

import { sendWelcomeEmail, sendAccountApprovedEmail } from './utils/mailer.js';

async function runTests() {
  console.log('Testing sendWelcomeEmail...');
  await sendWelcomeEmail('test@example.com', 'Test User');

  console.log('Testing sendAccountApprovedEmail...');
  await sendAccountApprovedEmail('test@example.com', 'Test User');
}

runTests();
