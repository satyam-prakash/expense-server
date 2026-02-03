const nodemailer = require('nodemailer');

const emailClient = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.GOOGLE_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
    }
});
const emailService={
    send: async(to,subject,body)=>{
        try {
            const emailOptions = {
                from: process.env.GOOGLE_EMAIL,
                to: to,
                subject: subject,
                text: body
            };
            console.log('Attempting to send email to:', to);
            const result = await emailClient.sendMail(emailOptions);
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    },
};
module.exports = emailService;