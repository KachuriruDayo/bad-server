import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { constants } from 'http2';
import { join } from 'path';
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
            .withMetadata({})
            .toBuffer()
            .then(data => sharp(data).toFile(tempPath));

        const metadata = await sharp(tempPath).metadata();

        if (!metadata.width || !metadata.height) {
            await unlink(tempPath);
            throw new BadRequestError('Невозможно прочитать метаданные изображения');
        }

        return res.status(constants.HTTP_STATUS_OK).send({
            fileName: req.file.filename,
            originalName: req.file.originalname,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
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
