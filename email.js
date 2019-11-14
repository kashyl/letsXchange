var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'letsxchangeproject@gmail.com',
    pass: 'dFxD95U*D@W'
  }
});

var mailOptions = {
  from: 'letsxchangeproject@gmail.com',
  to: 'jivjav9@gmail.com',
  subject: 'LetsXchange Offer',
  text: 'test'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});