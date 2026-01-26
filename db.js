const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("database", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

// 定义用户模型
const User = sequelize.define("User", {
  open_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "",
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "",
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
  await User.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  User,
};
