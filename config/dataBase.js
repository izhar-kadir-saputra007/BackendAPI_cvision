import { Sequelize } from "sequelize";

const db = new Sequelize(`metime`, `root`, ``, {
    host: `localhost`,
    dialect: `mysql`,
    logging: false
})

export default db