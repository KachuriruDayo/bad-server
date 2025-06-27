import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    const absBaseDir = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        const requestedPath = path.normalize(req.path)

        const filePath = path.resolve(absBaseDir, `.${  requestedPath}`) // . + чтобы избежать игнорирования baseDir при абсолютных путях

        if (!filePath.startsWith(absBaseDir)) {
            return next()
        }

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return next()
            }
            res.sendFile(filePath, (err) => {
                if (err) next(err)
            })
        })
    }
}
