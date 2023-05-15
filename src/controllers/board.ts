import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

export const createBoardd = async (req: Request, res: Response) => {
  const { tasks, columns, sourceCol, destCol, prevIndex, nextIndex } = req.body
  const { task } = req.params

  console.log(task)
  const arrayOfColumns = Object.keys(columns).map((key) => columns[key])
  const arrayOfTasks = Object.keys(tasks).map((key) => tasks[key])
  //   const arrayOfsourceCol = Object.keys(sourceCol).map((key) => sourceCol[key])
  //   const arrayOfdestCol = Object.keys(destCol).map((key) => destCol[key])
  console.log(sourceCol, destCol)

  try {
    if (task) {
      // source

      //   await prisma.column.update({
      //     where: {
      //         id: sourceCol
      //     },
      //     data: {
      //         tasks: {
      //             disconnect: { id: taskId },
      //         }
      //     }
      //   })
      //dest
      const currColumn = arrayOfColumns.find((item) => item.id === destCol)

      await prisma.column.update({
        where: {
          id: destCol,
        },
        data: {
          tasks: {
            set: [{ id: 4 }, { id: 3 }],
          },
        },
      })
    } else {
      // await prisma.board.create({
      //     data: {
      //       columns: {
      //         create: arrayOfColumns.map((column) => ({
      //           columnId: column.columnId,
      //           title: column.title,
      //           tasks: {
      //             create: arrayOfTasks
      //               .filter((task) => column.taskIds.includes(task.taskId))
      //               .map((task) => ({
      //                 taskId: task.taskId,
      //                 content: task.content,
      //               })),
      //           },
      //         })),
      //       },
      //     },
      //   });
    }
    res.json({ message: 'success' })
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    })
  }

  //   res.json({ message: 'ola girls' })
}

export const reorderTask = async (req: Request, res: Response) => {
  const { taskId } = req.params
  const { columnId, isChangingColumn, prevTask, nextTask } = req.body

  let newTaskPosition = 1024

  try {
    if (prevTask === undefined && nextTask === undefined) {
      newTaskPosition = 1024
    } else if (prevTask === undefined) {
      newTaskPosition = nextTask - 512
    } else if (nextTask === undefined) {
      newTaskPosition = prevTask + 512
    } else {
      newTaskPosition = Math.floor((prevTask + nextTask) / 2)
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
      Math.abs(newTaskPosition - prevTask) <= 1 ||
      Math.abs(newTaskPosition - nextTask) <= 1
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
  const { title } = req.body
  try {
    const response = await prisma.column.create({
      data: {
        title: title,
        columnPosition: 1,
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
  } catch (err) {}
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
    console.log(columnsObject)

    const formattedData = {
      tasks: tasksObject,
      columns: columnsObject,
      columnOrder: board?.columns.map((column) => `column-${column.id}`),
    }

    res.json({ ...formattedData })
  } catch (err: any) {
    console.error(err)
  }
}
