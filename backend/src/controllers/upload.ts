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

    try {
        const tempPath = join(
            __dirname,
            '../public/',
            process.env.UPLOAD_PATH_TEMP || '',
            req.file.filename
        );

        const finalPath = join(
            __dirname,
            '../public/',
            process.env.UPLOAD_PATH || '',
            req.file.filename
        );
        
        const metadata = await sharp(tempPath).metadata();
        if (!metadata.width || !metadata.height) {
            throw new BadRequestError('Невозможно прочитать метаданные изображения');
        }
        
        await sharp(tempPath)
            .toFormat('jpeg')
            .toFile(finalPath);
        
        await unlink(tempPath);

        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName: finalPath,
            originalName: req.file.originalname,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
        });
    } catch (error) {
        return next(error);
    }
};
