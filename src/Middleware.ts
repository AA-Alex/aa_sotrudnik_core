import * as jwt from 'jsonwebtoken';

import { HttpException, HttpStatus, Injectable, Logger, mixin, NestMiddleware, } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { secret } from './User/user.service';
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
        ) {};

        async use(req: Request, resp: Response, next: NextFunction) {

            console.log('\n\n');
            console.time('Время запроса: >>')
            console.log('url :>> ', req.baseUrl);
            console.log('пришло :>> ', req.body);

            let respStatus = 500;
            let parsedUserData: { id: number, lvl: number } = null;
            const sApiKey = String(req.headers.apikey)

            if (sApiKey?.length && level > 0) {
                try {

                    parsedUserData = <{ id: number, lvl: number }>jwt.verify(sApiKey, secret)

                    respStatus = 200; // Всё ок

                    if (parsedUserData?.id) {
                        const vUser = await this.userRepository.findOneBy({ id: parsedUserData.id });

                        if (vUser?.token !== sApiKey) {
                            console.timeEnd('Время запроса: >>')
                            console.log('Токен пользователя устарел!');
                            throw new Error('Токен пользователя устарел!')
                        }
                        console.log('Текущий пользователь :>> ', `id: ${vUser.id}  name: ${vUser.login}`);

                    }

                } catch (e) {
                    console.timeEnd('Время запроса: >>')
                    console.log(`Сломалось на проверке JWT\n ${e}`);
                    throw new HttpException('Ошибка сервера!', HttpStatus.INTERNAL_SERVER_ERROR);
                }

                if (!((parsedUserData?.lvl >= (level ?? 0)) || (parsedUserData?.lvl === 100)) && respStatus !== 500) {
                    console.timeEnd('Время запроса: >>')
                    console.log('Сломалось на проверке уровня доступа 1');
                    throw new HttpException('Ошибка доступа', HttpStatus.FORBIDDEN);
                }
            } else if (level === 0) {
                respStatus = 200;
            }

            resp.status(respStatus)

            if (respStatus === 200) {
                req.body.curr_user = parsedUserData?.id || 0;


                next();
            } else {
                console.timeEnd('Время запроса: >>')
                console.log('Сломалось на проверке уровня доступа 2');
                throw new HttpException('Ошибка доступа', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Спизжено отсюда https://yflooi.medium.com/nestjs-request-and-response-logging-with-middleware-b486121e4907
            // не понятно, но работает - рисует ответ любого метода в логи
            const getResponseLog = (res: Response) => {
                const rawResponse = res.write;
                const rawResponseEnd = res.end;
                const chunkBuffers = [];
                res.write = (...chunks) => {
                    const resArgs = [];
                    for (let i = 0; i < chunks.length; i++) {
                        resArgs[i] = chunks[i];
                        if (!resArgs[i]) {
                            res.once('drain', res.write);
                            i--;
                        }
                    }
                    if (resArgs[0]) {
                        chunkBuffers.push(Buffer.from(resArgs[0]));
                    }
                    return rawResponse.apply(res, resArgs);
                };
                res.end = (...chunk) => {
                    const resArgs = [];
                    for (let i = 0; i < chunk.length; i++) {
                        resArgs[i] = chunk[i];
                    }
                    if (resArgs[0]) {
                        chunkBuffers.push(Buffer.from(resArgs[0]));
                    }
                    const body = Buffer.concat(chunkBuffers).toString('utf8');
                    const responseLog = body || {};

                    console.log('Ответ: >> ', responseLog);
                    rawResponseEnd.apply(res, resArgs); // ,без этого запрос не заканчивается

                    return responseLog as unknown as Response;
                };
            };

            getResponseLog(resp)
            console.timeEnd('Время запроса: >>')

            console.log('\n\n');
        }
    }

    return mixin(Middleware);
}



