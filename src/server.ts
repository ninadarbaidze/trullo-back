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



 const listenToServer =server.listen(3001, () =>
  console.log(`
  🚀 Server ready at: http://localhost:3001`
  ))

const io = require('./socket').init(listenToServer);
io.on('connection', (_socket: any) => {
  console.log('Client connected');
  
});
