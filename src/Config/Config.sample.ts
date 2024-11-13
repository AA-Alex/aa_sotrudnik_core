const bdTypeT: 'mysql' | 'mariadb' | 'postgres' = 'postgres' // нужно чтобы TypeOrmModule.forRoot приняла тип
/** Конфиг БД */
export const dbConf = {
    type: bdTypeT,
    host: 'localhost',
    port: 5432,
    username: 'alex',
    password: '123',
    database: 'postgres',
}
