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

      const response = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPass,
        },
      })

      const registerToken = jwt.sign(
        { id: response.id, username: response.username },
        process.env.SIGNUP_TOKEN as string,
        { expiresIn: '15m' }
      )

      res.status(201).json({
        message: 'user created successfully',
        token: registerToken,
      })
    }
  } catch (err: any) {
    console.error(err)
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    })

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Please provide correct credentials' })
    }

    const isPasswordEqual = await bcrypt.compare(password, user!.password!)

    if (!isPasswordEqual) {
      return res
        .status(401)
        .json({ message: 'Please provide correct credentials' })
    }

    //TODO: activate refresh token if user wants to remember

    const accessToken = jwt.sign(
      { userId: user!.id },
      process.env.ACCESS_TOKEN!,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user!.id },
      process.env.ACCESS_TOKEN!,
      { expiresIn: '30m' }
    )
    // console.log(refreshToken)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 30 * 60 * 1000,
    })

    res.status(201).json({
        message: 'success',
        accessToken,
        userId: user.id
    })

    console.log(user)
  } catch (err: any) {
    console.log(err)
  }
}
