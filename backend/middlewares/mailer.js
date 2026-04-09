import nodemailer from 'nodemailer';

const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();

const mailConfig = sendgridApiKey
    ? {
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'apikey',
            pass: sendgridApiKey
        }
    }
    : {
        host: process.env.MAIL_HOST?.trim(),
        port: Number(process.env.MAIL_PORT),
        auth: {
            user: process.env.MAIL_USER?.trim(),
            pass: process.env.MAIL_PASSWORD?.trim()
        }
    };

const mailer = nodemailer.createTransport(mailConfig);

export default mailer;
