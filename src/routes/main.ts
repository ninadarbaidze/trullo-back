import { createBoard, createTask, createColumn, reorderTask, getBoard, reorderColumn } from "controllers"
import express from "express"

const router = express.Router()

// router.post('/board/:task?', )
router.post('/task/:columnId', createTask)
router.post('/createColumn/:boardId', createColumn)
router.post('/createBoard', createBoard)
router.patch('/reorder/:taskId', reorderTask)
router.patch('/reorder-column/:columnId', reorderColumn)
router.get('/board/:boardId', getBoard)

export default router
