import express from "express";
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { board, auth } from "routes";
const cookieParser = require('cookie-parser');


const server = express()

dotenv.config()

server.use(cookieParser());
server.use(bodyParser.json())
server.use(cors({ credentials: true, origin: true }));
server.use(board)
server.use(auth)


 server.listen(3001, () =>
  console.log(`
  🚀 Server ready at: http://localhost:3001
  ⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`),
  )