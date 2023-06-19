import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response, json } from 'express'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sendConfirmationEmail } from 'mail'
import { isTokenExpired } from 'utils'

const prisma = new PrismaClient()

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password, firstName, lastName } = req.body

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
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
        firstName,
        lastName,
      },
    })

    const registerToken = jwt.sign(
      { id: response.id, username: response.username },
      process.env.SIGNUP_TOKEN as string,
      { expiresIn: '15m' }
    )
    await sendConfirmationEmail(username, email as string, registerToken)

    res.status(201).json({
      message: 'user created successfully',
    })
  } catch (err: any) {
    console.error(err)
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { username, password, remember } = req.body

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

    const accessToken = jwt.sign({ userId: user!.id }, process.env.ACCESS_TOKEN!, {
      expiresIn: '15m',
    })

    if (remember) {
      const refreshToken = jwt.sign({ userId: user!.id }, process.env.REFRESH_TOKEN!, {
        expiresIn: '30d',
      })
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 2592000000,
      })
    }

    const { password: _pass, ...modifiedUserData } = user

    res.status(201).json({
      message: 'success',
      accessToken,
      user: modifiedUserData,
    })
  } catch (err: any) {
    console.error(err)
  }
}

export const logoutUser = (req: Request, res: Response, next: NextFunction) => {}

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

    if (!user) return res.status(404).json({ message: 'user does not exists' })

    const accessToken = jwt.sign({ userId: user!.id }, process.env.ACCESS_TOKEN!, {
      expiresIn: '15m',
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

export const uploadAvatar = async (req: Request) => {}

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body
  const { token } = req.params

  try {
    const { userId } = jwt.verify(token, process.env.ACCESS_TOKEN!) as JwtPayload

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!password || !existingUser) {
      return res.status(404).json({
        message: 'Something went wrong, please check your registration method',
      })
    }

    if (isTokenExpired(token)) {
      res.status(401).json({ message: 'Your Token is expired' })
    }

    const hashedPass = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPass,
      },
    })

    res.status(200).json({
      message: 'Password is updated',
    })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  const { new_password, email, username, avatar, firstName, lastName } = req.body
  const image = req.file!
  const { userId } = req.params
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: +userId,
      },
    })

    if (!existingUser) {
      return res.status(404).json({
        message: 'User does not exists',
      })
    }

    const userWithSameEmailOrUsername = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser.id !== userWithSameEmailOrUsername!.id) {
      return res.status(409).json({
        message: 'someone with this credentials already exists!',
      })
    }

    const password = new_password ? await bcrypt.hash(new_password, 12) : existingUser.password

    let updatedData = {}

    if (username === existingUser.username && email === existingUser.email) {
      updatedData = {
        avatar: image?.path ?? avatar,
        password: password,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
      }
    } else if (username === existingUser.username && email !== existingUser.email && email) {
      updatedData = {
        avatar: image?.path ?? avatar,
        password: password,
        email,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
      }
    } else if (username && username !== existingUser.username && email === existingUser.email) {
      updatedData = {
        avatar: image?.path ?? avatar,
        password: password,
        username,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
      }
    } else if (
      username &&
      username !== existingUser.username &&
      email !== existingUser.email &&
      email
    ) {
      updatedData = {
        avatar: image?.path ?? avatar,
        password: password,
        username,
        email,
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
      }
    }

    const response = await prisma.user.update({
      where: {
        id: +userId,
      },
      data: updatedData,
    })

    res.status(200).json({
      message: 'Profile updated successfully',
      userInfo: response,
    })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getProfileInfo = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: +userId,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'User does not exists',
      })
    }

    res.json(user)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params
  try {
    const users = await prisma.user.findMany({
      where: {
        boards: {
          none: {
            board: {
              id: +boardId,
            },
          },
        },
        isVerified: true
      },
      
    })
    res.json(users)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}


