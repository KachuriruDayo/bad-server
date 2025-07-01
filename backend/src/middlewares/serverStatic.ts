import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export default function serveStatic(baseDir: string) {
    const absBaseDir = path.resolve(baseDir);

    return (req: Request, res: Response, next: NextFunction) => {
        const requestedPath = path.normalize(req.path);
        
        const filePath = path.resolve(absBaseDir, `.${  requestedPath}`);
        
        if (!filePath.startsWith(absBaseDir)) {
            console.warn(`[serveStatic] Path Traversal attempt: ${filePath}`);
            return res.status(403).send('Forbidden');
        }
        
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return next();
            }

            if (!stats.isFile()) {
                return next();
            }
            
            res.sendFile(filePath, (err) => {
                if (err) {
                    next(err);
                }
            });
        });
    };
}
