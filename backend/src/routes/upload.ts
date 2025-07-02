import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import fileMiddleware, { checkFileMinSize } from '../middlewares/file';

const uploadRouter = Router()
uploadRouter.post('/', fileMiddleware.single('file'), checkFileMinSize, uploadFile)

export default uploadRouter
