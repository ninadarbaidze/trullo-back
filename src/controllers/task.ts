import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import fs from 'fs'

const prisma = new PrismaClient()

export const postTaskDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const { name, description, difficulty } = req.body
  const image = req.file

  try {
    const existingTask = await prisma.task.findUnique({
      where: {
        id: +taskId,
      },
      include: {
        attachments: true,
        description: true,
      },
    })

    if (!existingTask) {
      res.status(404).json({ message: 'Task not available' })
    }

    if (image?.path) {
      existingTask?.image && fs.unlinkSync(existingTask?.image)
    }

    const response = await prisma.task.update({
      where: {
        id: +taskId,
      },
      data: {
        content: !name || name === 'undefined' ? existingTask!.content : name,
        description: {
          upsert: {
            create: {
              content: description ?? '',
            },
            update: {
              content: description ? description : existingTask!.description?.content,
            },
          },
        },
        image: !image ? existingTask?.image : image?.path,
        difficulty: difficulty ? +difficulty : existingTask?.difficulty,
      },
    })

    res.json(response)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
export const addAttachments = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const attachment = req.files as unknown as {
    image: [{ path: '' }]
    attachments: [{ path: '' }]
  }[]

  try {
    const existingTask = await prisma.task.findUnique({
      where: {
        id: +taskId,
      },
      include: {
        attachments: true,
      },
    })

    if (!existingTask) {
      res.status(404).json({ message: 'Task not available' })
    }

    if (attachment.length > 0) {
      const response = await prisma.task.update({
        where: {
          id: +taskId,
        },
        data: {
          attachments: {
            createMany: {
              data: attachment?.map((file) => ({
                file: file.path.slice(8),
                type: file.mimetype?.includes('application') ? 1 : 0,
              })),
            },
          },
        },
      })
    }

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const deleteTaskAttachment = async (req: Request, res: Response, next: NextFunction) => {
  const { attachmentId } = req.params

  try {
    const response = await prisma.taskAttachments.delete({
      where: {
        id: +attachmentId,
      },
    })

    fs.unlinkSync('uploads/' + response.file)

    res.json({ message: 'success', response })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getTaskDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params

  try {
    const existingTask = await prisma.task.findUnique({
      where: {
        id: +taskId,
      },
      include: {
        attachments: true,
        description: true,
        users: {
          include: {
            user: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            id: 'desc',
          },
        },
      },
    })

    if (!existingTask) {
      res.status(404).json({ message: 'Task not available' })
    }
    res.json({ ...existingTask, users: existingTask?.users.map((user) => user.user) })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const removeTaskCover = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId, imageName } = req.params

  try {
    await prisma.task.update({
      where: {
        id: +taskId,
      },
      data: {
        image: null,
      },
    })

    fs.unlinkSync('uploads/' + imageName)

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const downloadTaskAttachment = async (req: Request, res: Response, next: NextFunction) => {
  const { attachmentId } = req.params
  try {
    const attachment = await prisma.taskAttachments.findUnique({
      where: {
        id: +attachmentId,
      },
    })

    console.log(attachment)
    const file = attachment?.file

    const filePath = `uploads/${file}`

    console.log(filePath)

    res.download(filePath, file)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  try {
    const { userIds } = req.body

    await prisma.task.update({
      where: {
        id: +taskId,
      },
      data: {
        users: {
          createMany: {
            data: userIds.map((user: number) => ({ userId: user })),
          },
        },
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const deleteUserFromTask = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId, userId } = req.params
  try {
    await prisma.usersOnTasks.delete({
      where: {
        userId_taskId: {
          taskId: +taskId,
          userId: +userId,
        },
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const addLabel = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params
  const { color, title } = req.body
  try {
    const label = await prisma.label.create({
      data: {
        color,
        title,
        board: {
          connect: {
            id: +boardId,
          },
        },
      },
    })

    res.json(label)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const assignLabel = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId, labelId } = req.params
  try {
    await prisma.labelsOnTasks.create({
      data: {
        labelId: +labelId,
        taskId: +taskId,
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const removeLabel = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId, labelId } = req.params
  try {
    await prisma.labelsOnTasks.delete({
      where: {
        taskId_labelId: {
          labelId: +labelId,
          taskId: +taskId,
        },
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const deleteLabel = async (req: Request, res: Response, next: NextFunction) => {
  const { labelId } = req.params
  try {
    await prisma.label.delete({
      where: {
        id: +labelId,
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const getBoardLabels = async (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params

  try {
    const labels = await prisma.label.findMany({
      where: {
        boardId: +boardId,
      },
    })

    res.json(labels)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const postComment = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params

  const { content, userId } = req.body

  try {
    const response = await prisma.comment.create({
      data: {
        content,
        taskId: +taskId,
        userId: +userId,
      },
    })

    res.json(response)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
export const editComment = async (req: Request, res: Response, next: NextFunction) => {
  const { commentId, content } = req.body
  try {
    await prisma.comment.update({
      where: {
        id: +commentId,
      },
      data: {
        content,
      },
    })

    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  const { commentId } = req.params

  try {
    await prisma.comment.delete({
      where: {
        id: +commentId,
      },
    })
    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
