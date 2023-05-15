import { createBoard, createTask, createColumn, reorderTask, getBoard } from "controllers"
import express from "express"

const router = express.Router()

// router.post('/board/:task?', )
router.post('/task/:columnId', createTask)
router.post('/createColumn/:boardId', createColumn)
router.post('/createBoard', createBoard)
router.patch('/reorder/:taskId', reorderTask)
router.get('/board/:boardId', getBoard)

export default router
