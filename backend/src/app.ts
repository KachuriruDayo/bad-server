import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
// import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from "helmet";
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    // keyGenerator: (req) => (req as any).user?.id || req.ip,
    message: 'Слишком много запросов, попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
});

const { PORT = 3000 } = process.env
const app = express()

app.use(globalLimiter);

app.use(helmet())

app.use(cors({ origin: process.env.ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(serveStatic(path.join(__dirname, 'public')))


app.use(json({ limit: '10mb' }))
app.use(urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

app.options('*', cors({ origin: process.env.ORIGIN_ALLOW, credentials: true }));

// app.use(mongoSanitize());

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
