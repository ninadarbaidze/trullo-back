import { PrismaClient } from '@prisma/client'
import { Request, Response, json } from 'express'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sendConfirmationEmail } from 'mail'

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
      return res.status(409).json({
        message: 'someone with this credentials already exists!',
      })
    }

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
    await sendConfirmationEmail(username, email as string, registerToken)
  } catch (err: any) {
    console.error(err)
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { username, password, remember } = req.body
  console.log(remember)

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'Please provide correct credentials' })
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Your account is not activated, please activate your account first',
      })
    }

    const isPasswordEqual = await bcrypt.compare(password, user!.password!)

    if (!isPasswordEqual) {
      return res.status(401).json({ message: 'Please provide correct credentials' })
    }

    //TODO: activate refresh token if user wants to remember

    const accessToken = jwt.sign({ userId: user!.id }, process.env.ACCESS_TOKEN!, {
      expiresIn: '10s',
    })

    if (remember) {
      const refreshToken = jwt.sign({ userId: user!.id }, process.env.REFRESH_TOKEN!, {
        expiresIn: '14d',
      })
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 1209600000,
      })
    }

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
        if (err) return res.status(403).json({ message: 'refresh token expired' })
      }
    ) as unknown as JwtPayload

    if (decodedToken) {
      user = await prisma.user.findUnique({
        where: {
          id: (decodedToken as JwtPayload)?.userId,
        },
      })
    }
    console.log(decodedToken)

    if (!user) return res.status(404).json({ message: 'user does not exists' })

    const accessToken = jwt.sign({ userId: user!.id }, process.env.ACCESS_TOKEN!, {
      expiresIn: '10s',
    })
    res.json({ token: accessToken })
  } catch (err: any) {
    console.error(err)
  }
}

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { id } = jwt.verify(token, process.env.SIGNUP_TOKEN as string) as JwtPayload

    const isTokenExpired = (tok: string) =>
      Date.now() >= JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).exp * 1000

    if (isTokenExpired(token)) {
      res.status(401).json({ message: 'Your ask for another token' })
      return
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      res.status(404).json({ message: "Unfortunately user doesn't exists" })
      return
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        isVerified: true,
      },
    })

    res.status(200).json({ message: 'Your account is activated' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
  }
}
