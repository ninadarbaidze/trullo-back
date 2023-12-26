import nodemailer from 'nodemailer'
import path from 'path'
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars'

export const sendConfirmationEmail = async (username: string, email: string, token: string ) => {

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_GMAIL_USER,
      pass: process.env.MAIL_GMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const handlebarOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
      extname: ".handlebars",
      partialsDir: path.join(`${process.cwd()}/src/views`),
      defaultLayout: false,
    },
    viewPath: path.join(`${process.cwd()}/src/views`),
    extName: ".handlebars",
  }


  transporter.use('compile', hbs(handlebarOptions));

  const verificationUrl = `${process.env.FRONT_URL}/user/auth?verify-account=${token}`
  
  let mailOptions = {
    from: 'Trullo Team',
    to: email,
    subject: `Confirm your account ${username}`,
    template: 'confirmAccount',  
    context: {
      username: username,
      url: verificationUrl
    }
  }
  
  transporter.sendMail(mailOptions, (err, success) => {
    if(err) {
      console.error(err)
    } else {
      console.log('Email sent successfully')
    }
  })
}

