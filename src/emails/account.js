const sgMail = require('@sendgrid/mail');
const sendGridAPIKey= process.env.SEND_GRID_API;
const emailFrom = process.env.EMAIL_FROM;

sgMail.setApiKey(sendGridAPIKey);

const sendWelcomeEmail = (email, name) => {
    try {
        sgMail.send({
            to: email,
            from: emailFrom,
            subject: 'Test',
            text: `test email, ${name}`,
        })
    } catch (e) {
        console.log(e);
    }
};

const sendCancelEmail = (email, name) => {
    try {
        sgMail.send({
            to: email,
            from: emailFrom,
            subject: 'Test cancel',
            text: `test email cancel, ${name}`,
        })
    } catch (e) {
        console.log(e);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
};