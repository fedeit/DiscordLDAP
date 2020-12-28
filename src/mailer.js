const nodemailer = require("nodemailer");
const handlebars = require('handlebars');

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


exports.sendInvite = async (inviteLink, userEmail) => {
  var replacements = {
       inviteLink: inviteLink
  };
  let htmlTemplate = loadTemplate(replacements);
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.SMTP_FROM, // sender address
    to: userEmail, // list of receivers
    subject: `Discord Invite from ${process.env.ORGANIZATION_NAME}`, // Subject line
    text: inviteLink, // plain text body
    html: inviteLink, // html body
  });
}

let readHTMLFile = function(path) {
  // Try loading the content of the html template
  try {
    return fs.readFileSync(path, {encoding: 'utf-8'});
  } catch (error) {
    console.log(error);
  }
};

let loadTemplate = (replacements) => {
  // Get the html template
  let templatePath = __dirname + 'templates/invite.html';
  let html = readHTMLFile(templatePath);
  // Apply replacements
  var template = handlebars.compile(html);
  return template(replacements);
}