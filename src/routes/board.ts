import {
  createBoard,
  createTask,
  createColumn,
  reorderTask,
  getBoard,
  reorderColumn,
  deleteTask,
  deleteColumn,
  updateColumn,
  updateTask,
  getAllBoards,
} from 'controllers'
import express from 'express'
import { isAuth } from 'middlewares'

const router = express.Router()

router.post('/create-task/:columnId', createTask)
router.post('/create-column/:boardId', createColumn)
router.post('/create-board', createBoard)
router.patch('/reorder-task/:taskId', reorderTask)
router.patch('/reorder-column/:columnId', reorderColumn)
router.get('/board/:boardId', isAuth, getBoard)
router.get('/boards/:userId', isAuth, getAllBoards)
router.delete('/delete-task/:taskId', deleteTask)
router.delete('/delete-column/:columnId', deleteColumn)
router.patch('/update-column/:columnId', updateColumn)
router.patch('/update-task/:taskId', updateTask)

export default router
