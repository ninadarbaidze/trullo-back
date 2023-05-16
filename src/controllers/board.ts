import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const reorderTask = async (req: Request, res: Response) => {
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
      console.log('me')
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
    console.error(err)
  }
}

export const reorderColumn = async (req: Request, res: Response) => {
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

      console.log(orderedData)

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
    console.error(err)
  }
}

export const createTask = async (req: Request, res: Response) => {
  const { columnId } = req.params
  const { content, prevIndex } = req.body
  try {
    const response = await prisma.task.create({
      data: {
        content,
        taskPosition: prevIndex ? prevIndex + 1024 : 1024,
        column: {
          connect: { id: +columnId },
        },
      },
    })

    res.json({ ...response, id: `task-${response.id}` })
  } catch (err) {
    console.error(err)
  }
}

export const createColumn = async (req: Request, res: Response) => {
  const { boardId } = req.params
  const { title , prevIndex} = req.body
  try {
    const response = await prisma.column.create({
      data: {
        title: title,
        columnPosition: prevIndex ? prevIndex + 1024 : 1024,
        board: {
          connect: { id: +boardId },
        },
      },
    })
    res.json({ ...response, id: `column-${response.id}` })
  } catch (err) {
    console.error(err)
  }
}

export const createBoard = async (req: Request, res: Response) => {
  const { name } = req.body
  try {
    await prisma.board.create({
      data: {
        name,
      },
    })
    res.json({ message: 'success' })
  } catch (err) {
    console.error(err)
  }
}

export const getBoard = async (req: Request, res: Response) => {
  const { boardId } = req.params
  try {
    const board = await prisma.board.findUnique({
      where: {
        id: +boardId,
      },
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
      },
    })

    const tasksObject = board?.tasks?.reduce((accumulator, value) => {
      return {
        ...accumulator,
        [`task-${value.id}`]: { ...value, id: `task-${value.id}` },
      }
    }, {})

    const columnsObject = board?.columns?.reduce((accumulator, value) => {
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

    const formattedData = {
      tasks: tasksObject,
      columns: columnsObject,
      columnOrder: board?.columns
        .sort((a, b) => (a.columnPosition > b.columnPosition ? 1 : -1))
        .map((column) => `column-${column.id}`),
    }

    res.json({ ...formattedData })
  } catch (err: any) {
    console.error(err)
  }
}
