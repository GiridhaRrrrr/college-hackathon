const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

// OAuth2 client setup
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendMail(to, subject, text) {
    try {
        // Generate access token
        const accessToken = await oAuth2Client.getAccessToken();

        // Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL,  // Sender's email
            to: to,                  // Recipient's email
            subject: subject,        // Dynamic email subject
            text: text,              // Dynamic email body text
        };

        // Send email
        const result = await transporter.sendMail(mailOptions);
        // console.log("Email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = sendMail;