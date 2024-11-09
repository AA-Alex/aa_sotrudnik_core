import * as jwt from 'jsonwebtoken';

import { Injectable, mixin, Module, NestMiddleware, NestModule } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { secret } from './User/user.service';
import { ctx } from './main';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from './User/Entity/user.entity';
import { Repository } from 'typeorm';

/**
 * Мидлвар по уровню доступа
 */
export function faAuthSysMiddleware(level: number): any {


    @Injectable()
    class Middleware implements NestMiddleware {

        constructor(
            @InjectRepository(User)
            private userRepository: Repository<User>,

        ) {}

        async use(req: Request, resp: Response, next: NextFunction) {

            // console.log('userRepository :>> ', this.userRepository);
            let respStatus = 500;
            let parsedUserData: { id: number, lvl: number } = null;
            const sApiKey = req.headers.apikey

            if (sApiKey?.length && level > 0) {
                try {

                    parsedUserData = <{ id: number, lvl: number }>jwt.verify(sApiKey, secret)

                    respStatus = 200; // Всё ок

                    if (parsedUserData?.id) {
                        const vUser = await this.userRepository.findOneBy({ id: parsedUserData.id });

                        if (vUser?.token !== sApiKey) {
                            console.log('Токен пользователя устарел!');
                            throw new Error('Токен пользователя устарел!')
                        }
                    }

                } catch (e) {

                    respStatus = 500; // Всё сломалось

                }

                if (!((parsedUserData?.lvl >= (level ?? 0)) || (parsedUserData?.lvl === 100)) && respStatus !== 500) {
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
            ctx.userSys.user_id = parsedUserData?.id || 0
        }
    }

    return mixin(Middleware);
}



