import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken'
import { sendInvitationEmail } from 'mail'
import { exclude } from 'utils'

const prisma = new PrismaClient()

export const reorderTask = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const { columnId, isChangingColumn, prevTaskId, nextTaskId } = req.body

  let newTaskPosition

  try {
    if (prevTaskId === undefined && nextTaskId === undefined) {
      newTaskPosition = 1024
    } else if (prevTaskId === undefined) {
      newTaskPosition = nextTaskId - 512
    } else if (nextTaskId === undefined) {
      newTaskPosition = prevTaskId + 512
    } else {
      newTaskPosition = Math.floor((prevTaskId + nextTaskId) / 2)
    }

    if (!isChangingColumn) {
      await prisma.task.update({
        where: {
          id: +taskId,
        },
        data: {
          taskPosition: newTaskPosition,
        },
      })
    } else {
      await prisma.task.update({
        where: {
          id: +taskId,
        },
        data: {
          column: {
            connect: { id: +columnId },
          },
          taskPosition: newTaskPosition,
        },
      })
    }

    if (
      Math.abs(newTaskPosition - prevTaskId) <= 1 ||
      Math.abs(newTaskPosition - nextTaskId) <= 1
    ) {
      const orderedData = await prisma.task.findMany({
        where: {
          columnId: +columnId,
        },
        select: {
          id: true,
          taskPosition: true,
        },
        orderBy: {
          taskPosition: 'asc',
        },
      })

      await Promise.all(
        orderedData.map(async (data, index) => {
          await prisma.task.updateMany({
            where: {
              id: data.id,
            },
            data: {
              taskPosition: (index + 1) * 1024,
            },
          })
        })
      )
    }

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const reorderColumn = async (req: Request, res: Response, next: NextFunction) => {
  const { columnId } = req.params
  const { boardId, prevColumnId, nextColumnId } = req.body

  let newColumnPosition

  try {
    if (prevColumnId === undefined && nextColumnId === undefined) {
      newColumnPosition = 1024
    } else if (prevColumnId === undefined) {
      newColumnPosition = nextColumnId - 512
    } else if (nextColumnId === undefined) {
      newColumnPosition = prevColumnId + 512
    } else {
      newColumnPosition = Math.floor((prevColumnId + nextColumnId) / 2)
    }

    await prisma.column.update({
      where: {
        id: +columnId,
      },
      data: {
        columnPosition: newColumnPosition,
      },
    })

    if (
      Math.abs(newColumnPosition - prevColumnId) <= 1 ||
      Math.abs(newColumnPosition - prevColumnId) <= 1
    ) {
      const orderedData = await prisma.column.findMany({
        where: {
          boardId: +boardId,
        },
        select: {
          id: true,
          columnPosition: true,
        },
        orderBy: {
          columnPosition: 'asc',
        },
      })

      await Promise.all(
        orderedData.map(async (data, index) => {
          await prisma.column.updateMany({
            where: {
              id: data.id,
            },
            data: {
              columnPosition: (index + 1) * 1024,
            },
          })
        })
      )
    }

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  const { columnId } = req.params
  const { content, prevIndex, boardId } = req.body
  try {
    const response = await prisma.task.create({
      data: {
        content,
        taskPosition: prevIndex ? prevIndex + 1024 : 1024,
        column: {
          connect: { id: +columnId },
        },
        board: {
          connect: {
            id: +boardId,
          },
        },
      },
    })

    res.status(201).json({ ...response, id: `task-${response.id}` })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const createColumn = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params
  const { title, prevIndex } = req.body
  try {
    const response = await prisma.column.create({
      data: {
        title,
        columnPosition: prevIndex ? prevIndex + 1024 : 1024,
        board: {
          connect: { id: +boardId },
        },
      },
    })
    res.json({ ...response, id: `column-${response.id}` })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  const { name, userId } = req.body
  const image = req.file
  try {
    const response = await prisma.board.create({
      data: {
        name: name,
        image: image?.path,
        boardOwnerId: +userId,
        users: {
          create: {
            user: {
              connect: {
                id: +userId,
              },
            },
          },
        },
      },
    })
    res.status(201).json({ message: 'success', boardId: response.id })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getBoard = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId, userId } = req.params

  try {
    const board = await prisma.usersOnBoards.findFirst({
      where: {
        AND: [
          { boardId: +boardId },
          {
            user: {
              id: +userId,
            },
          },
        ],
      },
      include: {
        board: {
          include: {
            columns: {
              include: {
                tasks: {
                  select: {
                    id: true,
                    taskPosition: true,
                  },
                },
              },
            },

            tasks: true,
            users: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!board) return res.status(404).json({ message: 'board not found' })

    const tasksObject = board?.board?.tasks?.reduce((accumulator, value) => {
      return {
        ...accumulator,
        [`task-${value.id}`]: { ...value, id: `task-${value.id}` },
      }
    }, {})

    const columnsObject = board?.board?.columns?.reduce((accumulator, value) => {
      return {
        ...accumulator,
        [`column-${value.id}`]: {
          id: `column-${value.id}`,
          title: value.title,
          columnPosition: value.columnPosition,
          taskIds: value.tasks
            .sort((a, b) => (a.taskPosition > b.taskPosition ? 1 : -1))
            .map((item) => `task-${item.id}`),
        },
      }
    }, {})

    const users = board?.board?.users
      .filter((user) => user.user.isVerified)
      .map((user) => exclude(user.user, ['password']))

    const formattedData = {
      tasks: tasksObject,
      columns: columnsObject,
      columnOrder: board?.board.columns
        .sort((a, b) => (a.columnPosition > b.columnPosition ? 1 : -1))
        .map((column) => `column-${column.id}`),
      name: board?.board?.name,
      users,
    }

    res.json({ ...formattedData })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getAllBoards = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params

  try {
    const boards = await prisma.usersOnBoards.findMany({
      where: {
        user: {
          id: +userId,
        },
      },
      include: {
        board: {
          include: {
            users: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        boardId: 'desc',
      },
    })

    const formattedBoard = boards.map((board) => ({
      ...board.board,
      users: board.board.users.map((user) => (exclude(user.user, ['password']), user.user)),
    }))
    res.json(formattedBoard)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  try {
    await prisma.task.delete({
      where: { id: +taskId },
    })

    res.json({ message: 'Deleted successfully' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const deleteColumn = async (req: Request, res: Response, next: NextFunction) => {
  const { columnId } = req.params
  try {
    await prisma.column.delete({
      where: { id: +columnId },
    })

    res.json({ message: 'Deleted successfully' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const { content } = req.body
  try {
    await prisma.task.update({
      where: { id: +taskId },
      data: {
        content,
      },
    })

    res.json({ message: 'Task updated successfully' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const updateColumn = async (req: Request, res: Response, next: NextFunction) => {
  const { columnId } = req.params
  const { title } = req.body
  try {
    await prisma.column.update({
      where: { id: +columnId },
      data: {
        title,
      },
    })

    res.json({ message: 'Column updated successfully' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const sendInvitationToBoard = async (req: Request, res: Response, next: NextFunction) => {
  const { users, boardName, boardId } = req.body
  try {
    const userIds = users.map((user: { id: number }) => user.id)

    const boardInvitationToken = jwt.sign(
      { userIds, boardId, boardName },
      process.env.INVITATION_TOKEN as string,
      { expiresIn: '4h' }
    )

    users.map(async (user: { username: string; email: string }) => {
      await sendInvitationEmail(
        user.username,
        user.email as string,
        boardInvitationToken,
        boardName
      )
    })

    res.json({ message: 'Invitations sent successfully', boardInvitationToken })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const verifyInvitation = async (req: Request, res: Response, next: NextFunction) => {
  const { token, userId } = req.body

  try {
    let decodedToken: { userIds: number[]; boardId: number; boardName: string } | undefined
    jwt.verify(token, process.env.INVITATION_TOKEN as string, function (err: any, decoded: any) {
      decodedToken = decoded
      if (err) return res.status(403).json({ message: 'your token is expired' })
    })
    const isUserFromMemberOfBoard = decodedToken?.userIds.some((user) => user === userId)

    if (!isUserFromMemberOfBoard)
      return res.status(403).json({ message: 'You can not access this board' })

    await prisma.usersOnBoards.createMany({
      data: [{ userId: userId, boardId: +decodedToken?.boardId! }],
    })

    res.json({
      message: 'success',
      boardId: decodedToken?.boardId,
      boardName: decodedToken?.boardName,
    })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getBoardData = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params
  try {
    const boardWithUsers = await prisma.board.findUnique({
      where: { id: +boardId },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    })
    const boardOwner = boardWithUsers?.users.find(
      (user) => user.userId === boardWithUsers.boardOwnerId
    )?.user
    const modifiedData = {
      ...boardWithUsers,
      boardOwner: boardOwner,
      users: boardWithUsers?.users.map((user) => (exclude(user.user, ['password']), user.user)),
    }

    res.json(modifiedData)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}


export const removeUserFromBoard = async(req: Request, res: Response, next: NextFunction) => {
  const {userId, boardId} = req.body
  try {
    await prisma.usersOnBoards.delete({
      where: {
        userId_boardId: {
          userId,
          boardId
        }
      }
    })

    res.json({message: 'success'})

  }catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
