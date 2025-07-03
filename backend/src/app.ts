import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from "helmet";
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    keyGenerator: (req) => (req as any).user?.id || req.ip,
    message: 'Слишком много запросов, попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
        res.status(options.statusCode).json({
            error: 'TooManyRequests',
            message: options.message,
        });
    }
});

const { PORT = 3000 } = process.env
const app = express()

app.use(helmet())
app.set('trust proxy', 1)

app.use(cors({ origin: process.env.ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(serveStatic(path.join(__dirname, 'public')))


app.use(json({ limit: '10mb' }))
app.use(urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

app.use(globalLimiter);

app.options('*', cors({ origin: process.env.ORIGIN_ALLOW, credentials: true }));

app.use(mongoSanitize());

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
