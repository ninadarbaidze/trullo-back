import { createBoard, createTask, createColumn, reorderTask, getBoard, reorderColumn, deleteTask, deleteColumn } from "controllers"
import express from "express"

const router = express.Router()

// router.post('/board/:task?', )
router.post('/create-task/:columnId', createTask)
router.post('/create-column/:boardId', createColumn)
router.post('/create-board', createBoard)
router.patch('/reorder-task/:taskId', reorderTask)
router.patch('/reorder-column/:columnId', reorderColumn)
router.get('/board/:boardId', getBoard)
router.delete('/delete-task/:taskId', deleteTask)
router.delete('/delete-column/:columnId', deleteColumn)

export default router
