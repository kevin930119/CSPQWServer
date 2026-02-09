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
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

// 定义图鉴模型
const Album = sequelize.define("Album", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cover: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// 定义图鉴图片模型
const AlbumImage = sequelize.define("AlbumImage", {
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  list_cover: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// 定义用户图鉴关系模型
const UserAlbumImage = sequelize.define("UserAlbumImage", {
  user_open_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  album_image_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

// 定义用户与图鉴的关系模型
const UserAlbum = sequelize.define("UserAlbum", {
  user_open_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  album_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
  await User.sync({ alter: true });
  await Album.sync({ alter: true });
  await AlbumImage.sync({ alter: true });
  await UserAlbumImage.sync({ alter: true });
  await UserAlbum.sync({ alter: true });
}

// 导出初始化方法、模型和sequelize实例
module.exports = {
  init,
  Counter,
  User,
  Album,
  AlbumImage,
  UserAlbumImage,
  UserAlbum,
  sequelize,
};
