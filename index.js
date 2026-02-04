const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB } = require("./db");
const routes = require("./routes");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 使用路由模块
app.use(routes);

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
