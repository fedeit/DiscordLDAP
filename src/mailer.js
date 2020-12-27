const nodemailer = require("nodemailer");

// Create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME, // generated ethereal user
    pass: process.env.SMTP_PASSWORD // generated ethereal password
  },
});


exports.sendInvite = (userEmail) => {
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.SMTP_FROM, // sender address
    to: userEmail, // list of receivers
    subject: `Discord Invite from ${process.env.ORGANIZATION_NAME}`, // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });
}