import * as jwt from 'jsonwebtoken';
import { secret, UsersService } from './user/user.service';

import { Injectable, mixin, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';


export function faAuthSysMiddleware(level: number): any {

    @Injectable()
    class Middleware implements NestMiddleware {

        use(req: Request, resp: Response, next: NextFunction) {

            let respStatus = 500;
            let userData: { id: number, lvl: number } = null;
            const sApiKey = req.headers.apikey

            if (sApiKey?.length) {
                try {

                    userData = <{ id: number, lvl: number }>jwt.verify(sApiKey, secret)
                    respStatus = 200; // Всё ок

                } catch (e) {

                    respStatus = 500; // Всё сломалось
                }

                if (!((userData?.lvl >= (level ?? 0)) || (userData?.lvl === 100))) {
                    respStatus = 403 // Нехватает прав TODO приделать роль
                }
            }

            resp.sendStatus(respStatus);
            // resp.setHeader('Content-Type', 'application/json');
            next();

        }
    }

    return mixin(Middleware)
}

export default class Middleware {

    constructor() {};

    /**
     * Дешифровка jwt токена по id пользователя и по уровню доступа пользователя
     */
    public async AuthSysMiddleware2(vApikey: any, iNeedLvl?: number): Promise<{ message: string, is_ok: boolean }> {
        let userData: { id: number, lvl: number } = null;
        let resp = { message: '', is_ok: false }

        const sApikey = vApikey?.headers?.apikey

        if (sApikey?.length) {
            try {

                userData = <{ id: number, lvl: number }>jwt.verify(sApikey, secret)

                resp.is_ok = true;

            } catch (e) {

                resp.message = 'Ошибка авторизации';
            }


            // TODO перепилить на нест и приделать проверку на существование пользователя
            // Приделать кеш KeyDB

            if (!((userData?.lvl >= (iNeedLvl ?? 0)) || (userData?.lvl === 100))) {
                resp.message = 'Ошибка доступа';
            }
        }

        return resp;
    }
}


