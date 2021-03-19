const nodemailer = require("nodemailer");
const handlebars = require('handlebars');
const fs = require('fs');

let templatePath = __dirname + '/../templates/invite.html';

// Create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME, // generated ethereal user
    pass: process.env.SMTP_PASSWORD // generated ethereal password
  },
});

exports.verify = (callback) => {
  // verify connection configuration
  transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
      callback(false)
    } else {
      console.log("Mailer is ready");
      callback(true)
    }
  });
}

exports.sendInvite = async (inviteCode, userEmail) => {
  return new Promise((resolve,reject) => {
    let inviteLink = "https://discord.gg/" + inviteCode;
    var replacements = {
         inviteLink: inviteLink
    };
    let htmlTemplate = loadTemplate(replacements);
    // send mail with defined transport object
    let config = {
      from: process.env.SMTP_FROM, // sender address
      to: userEmail, // list of receivers
      subject: `Discord Invite from ${process.env.ORGANIZATION_NAME}`, // Subject line
      text: htmlTemplate, // plain text body
      html: htmlTemplate, // html body
    }
    transporter.sendMail(config, (err, info) => {
      if (error) {
          console.error("MAIL ERROR is ", error);
          resolve(false);
      } else {
          console.log('Email sent: ', info);
          resolve(true);
      }
    });
  });
}

let readHTMLFile = (path) => {
  // Try loading the content of the html template
  try {
    return fs.readFileSync(path, {encoding: 'utf-8'});
  } catch (error) {
    return undefined
  }
};

let loadTemplate = (replacements) => {
  // Get the html template
  let html = readHTMLFile(templatePath);
  if (html === undefined) {
    return JSON.stringify(replacements)
  }
  // Apply replacements
  var template = handlebars.compile(html);
  return template(replacements);
}