import { Request, Express } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';


type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const MAX_SIZE = 10 * 1024 * 1024;
const MIN_SIZE = 2 * 1024;

const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
];

const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback,
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        );
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback,
    ) => {
        const ext = extname(file.originalname);
        const uniqueName = `${Date.now()}-${randomUUID()}${ext}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const ext = extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(file.mimetype) || !allowedExts.includes(ext)) {
        return cb(new Error('Недопустимый тип или расширение файла'));
    }
    cb(null, true);
};

export const checkFileMinSize = (req: Request, _res: any, next: any) => {
    if (req.file && req.file.size < MIN_SIZE) {
        return next(new Error('Файл слишком маленький (менее 2КБ)'));
    }
    next();
};

export default multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } })
