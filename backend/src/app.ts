import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from "express-rate-limit";
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Слишком много запросов с данного IP, попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
});

const { PORT = 3000 } = process.env
const app = express()

app.use(cookieParser())

app.use(cors())
// app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: true }))
app.use(json())

app.use(globalLimiter);

app.options('*', cors())
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
