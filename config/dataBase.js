// untuk server production

// import { Sequelize } from "sequelize";

// const db = new Sequelize('cvisionj_db_cvision', 'cvisionj_izhar', 'Ichal_2001', {
//     host: 'anzio-db.id.domainesia.com',
//     port: 3306,
//     dialect: 'mysql',
//     logging: false
// });

// export default db;

// masih tahap awal development
import { Sequelize } from "sequelize";

const db = new Sequelize(`metime`, ``, ``, {
    host: `localhost`,
    port: 3306,
    dialect: `mysql`,
    logging: false
})

export default db