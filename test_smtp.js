import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.ipower.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@holeenergy.com',
    pass: 'yQWERTY@12345a12345' // from .env.example
  }
});

transporter.verify()
  .then(() => console.log('SMTP connection successful'))
  .catch(err => console.error('SMTP connection failed:', err));
