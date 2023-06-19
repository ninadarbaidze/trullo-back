import { PrismaClient } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { task } from 'routes'
import path from 'path'

const prisma = new PrismaClient()

export const postTaskDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const { name, description } = req.body
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

    await prisma.task.update({
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
      },
    })

    res.json(existingTask)
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
export const addAttachments = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  const { attachments } = req.body
  const attachment = req.files as unknown as {
    image: [{ path: '' }]
    attachments: [{ path: '' }]
  }[]
  //   const attachment = req.files
  const parsedAttachment = attachments?.map((item) => JSON.parse(item))

  console.log(attachment)
  //   const uploadedFileIds = parsedAttachment?.map((item) => item.id)
  try {
    const existingTask = await prisma.task.findUnique({
      where: {
        id: +taskId,
      },
      include: {
        attachments: true
      }
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

   

    res.json({message: 'success'})
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
    await prisma.taskAttachments.delete({
      where: {
        id: +attachmentId,
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
          include:{
            user: true
          }
        }
      },
    })

    if (!existingTask) {
      res.status(404).json({ message: 'Task not available' })
    }
    res.json({...existingTask, users: existingTask?.users.map(user => user.user)})
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}

export const removeTaskCover = async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params
  try {
    await prisma.task.update({
      where: {
        id: +taskId,
      },
      data: {
        image: null,
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

export const downloadTaskAttachment = async (req: Request, res: Response, next: NextFunction) => {
  const { attachmentId } = req.params
  try {
    const attachment = await prisma.taskAttachments.findUnique({
      where: {
        id: +attachmentId
      }
    })

    console.log(attachment)
    const file = attachment?.file


    const filePath = `uploads/${file}`

    console.log( filePath)


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
    const {userIds} = req.body

    await prisma.task.update({
      where:{
        id: +taskId
      },
      data: {
        users: {
          createMany:{
            data: userIds.map((user: number) => ({userId: user}))
          }
        }
      }
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
          userId: +userId
        }
      }
    })
    
    res.json({ message: 'success' })
  } catch (err: any) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
  }
}
