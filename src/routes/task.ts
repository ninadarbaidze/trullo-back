import {
  postTaskDetails,
  getTaskDetails,
  addAttachments,
  deleteTaskAttachment,
  removeTaskCover,
  downloadTaskAttachment,
  assignTask,
  deleteUserFromTask
} from 'controllers'
import express from 'express'
import { isAuth } from 'middlewares'

import multer from 'multer'

const storageConfig = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storageConfig })

const router = express.Router()

router.post('/task-detail/:taskId', upload.single( 'image'), postTaskDetails)
router.get('/task-detail/:taskId', getTaskDetails)
router.patch('/add-attachments/:taskId', upload.array('attachments'), addAttachments)
router.delete('/delete-attachments/:attachmentId', deleteTaskAttachment)
router.delete('/task-image/:taskId', removeTaskCover)
router.get('/task-attachments/:attachmentId', downloadTaskAttachment)
router.patch('/assign-task/:taskId', isAuth, assignTask)
router.delete('/delete-user-task/:taskId/:userId', isAuth, deleteUserFromTask)



export default router
