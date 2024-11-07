import * as jwt from 'jsonwebtoken';

import { Injectable, mixin, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { secret } from './User/user.service';
import { ctx } from './main';

/**
 * Мидлвар по уровню доступа
 */
export function faAuthSysMiddleware(level: number): any {

    @Injectable()
    class Middleware implements NestMiddleware {

        use(req: Request, resp: Response, next: NextFunction) {

            let respStatus = 500;
            let userData: { id: number, lvl: number } = null;
            const sApiKey = req.headers.apikey

            if (sApiKey?.length && level > 0) {
                try {

                    userData = <{ id: number, lvl: number }>jwt.verify(sApiKey, secret)

                    respStatus = 200; // Всё ок

                } catch (e) {

                    respStatus = 500; // Всё сломалось

                }

                if (!((userData?.lvl >= (level ?? 0)) || (userData?.lvl === 100)) && respStatus !== 500) {
                    respStatus = 403 // Нехватает прав TODO приделать роль
                }
            } else if (level === 0) {
                respStatus = 200;
            }

            resp.status(respStatus)

            if (respStatus === 200) {
                next();
            } else {
                resp.send('Ошибка доступа');
            }
            ctx.userSys.user_id = userData?.id || 0
        }
    }

    return mixin(Middleware);
}



