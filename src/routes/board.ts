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

import multer from 'multer'

const storageConfig = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'images')
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storageConfig })

const router = express.Router()

router.post('/create-task/:columnId', isAuth, createTask)
router.post('/create-column/:boardId', isAuth, createColumn)
router.post('/create-board', isAuth, upload.single('image'), createBoard)
router.patch('/reorder-task/:taskId', isAuth, reorderTask)
router.patch('/reorder-column/:columnId', isAuth, reorderColumn)
router.get('/board/:boardId', isAuth, getBoard)
router.get('/boards/:userId', isAuth, getAllBoards)
router.delete('/delete-task/:taskId', isAuth, deleteTask)
router.delete('/delete-column/:columnId', isAuth, deleteColumn)
router.patch('/update-column/:columnId', isAuth, updateColumn)
router.patch('/update-task/:taskId', isAuth, updateTask)

export default router
