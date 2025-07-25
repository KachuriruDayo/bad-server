import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import fs from 'fs';
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path'
import rateLimit from 'express-rate-limit';
import helmet from "helmet";
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

const tempDir = path.join(__dirname, 'public', process.env.UPLOAD_PATH_TEMP || 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "http://localhost:3000", "data:"],
        }
    }
}))
app.set('trust proxy', 1)

app.use(cors({
    origin: process.env.ORIGIN_ALLOW,
    credentials: true,
}))

app.use('/images', (_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// app.use(express.static(path.join(__dirname, 'public')));
app.use(serveStatic(path.join(__dirname, 'public')))

app.use(json({ limit: '10kb' }))
app.use(urlencoded({ limit: '10kb', extended: true }))

app.use(cookieParser())

app.use(globalLimiter);

app.options('*', cors());

app.use(mongoSanitize({ replaceWith: '_' }));

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
