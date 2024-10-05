import * as jwt from 'jsonwebtoken';
import { secret, UsersService } from './user/user.service';

export default class Middleware {

    constructor() {};

    /**
     * Дешифровка jwt токена по id пользователя и по уровню доступа пользователя
     */
    public async AuthSysMiddleware(vApikey: any, iNeedLvl?: number): Promise<{ message: string, is_ok: boolean }> {
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

            if (!((userData?.lvl >= (iNeedLvl ?? 0)) || (iNeedLvl === 100))) {
                resp.message = 'Ошибка доступа';
            }
        }

        return resp;
    }
}


