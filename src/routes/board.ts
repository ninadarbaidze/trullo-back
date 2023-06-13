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
  sendInvitationToBoard,
  verifyInvitation,
  getBoardData,
  removeUserFromBoard,
  postBoardDescription,
  removeBoardImage
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
router.get('/board/:boardId/:userId', isAuth, getBoard)
router.get('/boards/:userId', isAuth,  getAllBoards)
router.delete('/delete-task/:taskId', isAuth, deleteTask)
router.delete('/delete-column/:columnId', isAuth, deleteColumn)
router.patch('/update-column/:columnId', isAuth, updateColumn)
router.patch('/update-task/:taskId', isAuth, updateTask)
router.post('/send-board-invitations/', isAuth, sendInvitationToBoard)
router.post('/verify-board', isAuth, verifyInvitation)
router.get('/board-detail/:boardId', isAuth, getBoardData)
router.patch('/remove-board-user', isAuth, removeUserFromBoard)
router.patch('/remove-board-image/:boardId', isAuth, removeBoardImage)
router.patch('/update-board/:boardId', isAuth,  upload.single('image'), postBoardDescription)

export default router
