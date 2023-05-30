import { PrismaClient } from '@prisma/client'
import { Request, Response, json } from 'express'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body

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
      process.env.REFRESH_TOKEN!,
      { expiresIn: '14d' }
    )
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 1209600000,
    })

    res.status(201).json({
      message: 'success',
      accessToken,
      userId: user.id,
    })
  } catch (err: any) {
    console.error(err)
  }
}

export const generateNewAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken
  try {
    let decodedToken
    let user
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN as string,
        function (err: any, decoded: any) {
            decodedToken = decoded
            if (err)
                return res.status(403).json({ message: 'refresh token expired' })
        }
    ) as unknown as JwtPayload


    if (decodedToken) {
         user = await prisma.user.findUnique({
          where: {
            id: (decodedToken as JwtPayload)?.userId,
          },
        })
    }

    if (!user) return res.status(404).json({ message: 'user does not exists' })

    const accessToken = jwt.sign(
      { userId: user!.id },
      process.env.ACCESS_TOKEN!,
      { expiresIn: '15m' }
    )
    res.json({ token: accessToken })

  } catch (err: any) {
    console.error(err)
  }
}
