import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'



const prisma = new PrismaClient()

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  console.log(username)

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })
    

    if (existingUser?.id) {
      res.status(409).json({
        message: 'someone with this credentials already exists!',
      })
    } else {
    const hashedPass = await bcrypt.hash(password, 12)

     const response =  await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPass,
        },
      })

      const registerToken = jwt.sign({ id: response.id, username: response.username }, process.env.SIGNUP_TOKEN as string, { expiresIn: '15m' });

      res.status(201).json({
        message: 'user created successfully',
        token: registerToken
      })
    }
  } catch (err: any) {
    console.error(err)
  }
}
