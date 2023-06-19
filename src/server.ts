import express from "express";
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { board, auth, task } from "routes";
import { errorHandler } from "middlewares";
const cookieParser = require('cookie-parser');


const server = express()

dotenv.config()

server.use(cookieParser());
server.use(bodyParser.json())
server.use('/images', express.static('images'));
server.use('/uploads', express.static('uploads'));

server.use(cors({ credentials: true, origin: true }));
server.use(auth)
server.use(board)
server.use(task)

server.use(errorHandler)



 server.listen(3001, () =>
  console.log(`
  🚀 Server ready at: http://localhost:3001
  ⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`),
  )