import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { constants } from 'http2';
import { join, basename } from 'path';
import { unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
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

    const cleanFileName = `${Date.now()}-${randomUUID()}`;
    let cleanPath = '';

    try {
        const metadata = await sharp(tempPath).metadata();

        if (!metadata.format || !metadata.width || !metadata.height) {
            throw new BadRequestError('Файл не является валидным изображением');
        }

        const safeExt = metadata.format === 'jpeg' ? '.jpg' : `.${metadata.format}`;
        cleanPath = tempPath.replace(req.file.filename, `${cleanFileName}${safeExt}`);

        await sharp(tempPath)
            .toFile(cleanPath);

        await unlink(tempPath).catch(() => {});

        return res.status(constants.HTTP_STATUS_OK).send({
            fileName: basename(cleanPath),
            originalName: req.file.originalname,
        });

    } catch (error) {
        await unlink(tempPath).catch(() => {});
        if (cleanPath) {
            await unlink(cleanPath).catch(() => {});
        }
        return next(error);
    }
};
