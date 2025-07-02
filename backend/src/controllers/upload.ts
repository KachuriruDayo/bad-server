import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { constants } from 'http2';
import path, { join } from 'path';
import { unlink } from 'fs/promises';
import BadRequestError from '../errors/bad-request-error';

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'));
    }

    const tempPath = join(
        __dirname,
        '../public/',
        process.env.UPLOAD_PATH_TEMP || '',
        req.file.filename
    );

    try {
        await sharp(tempPath)
            // Удаляем метаданные просто не добавляя их
            .toFile(`${tempPath  }_clean`);

        const metadata = await sharp(`${tempPath  }_clean`).metadata();

        if (!metadata.width || !metadata.height) {
            await unlink(`${tempPath  }_clean`);
            throw new BadRequestError('Невозможно прочитать метаданные изображения');
        }
        
        await unlink(tempPath);

        return res.status(constants.HTTP_STATUS_OK).send({
            fileName: path.basename(`${tempPath  }_clean`),
            originalName: req.file.originalname,
        });
    } catch (error) {
        try {
            await unlink(tempPath);
        } catch (unlinkErr) {
        console.error(`Ошибка при удалении временного файла: ${tempPath}`, unlinkErr);
    }

        return next(error);
    }
};
