import nodemailer from 'nodemailer'
import path from 'path'
import hbs, { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars'

export const sendInvitationEmail = async (username: string, email: string, token: string, boardName: string ) => {

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

  const verificationUrl = `${process.env.FRONT_URL}/user/auth?accept-invitation=${token}`
  
  let mailOptions = {
    from: 'Trullo Team',
    to: email,
    subject: `Join to our board ${boardName}`,
    template: 'inviteToBoard',  
    context: {
      username: username,
      boardName,
      url: verificationUrl
    }
  }
  
  transporter.sendMail(mailOptions, (err, success) => {
    if(err) {
      console.log(err)
    } else {
      console.log('Email sent successfully')
      console.log(success)
    }
  })
}

