import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express';
import {Error} from 'types/global'

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get('Authorization')
  if (!authHeader) {
    res.status(403).json({ message: 'Forbidden' })
    const error = new Error('Forbidden') as Error
    error.statusCode = 403
    throw error
  }
  const token = authHeader.split(' ')[1]
  const isTokenExpired = (tok: string) =>
    Date.now() >=
    JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).exp * 1000

  
  let decodedToken
  try {
    if (isTokenExpired(token)) {
      res.status(401).json({ message: 'Your Token is Expired' })
    }
    decodedToken = jwt.verify(token,  process.env.ACCESS_TOKEN as string)
  } catch (err: any) {
    err.statusCode = 500
    throw err
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.') as Error
    error.statusCode = 401
    throw error
  }
  next()
}

export default authMiddleware
