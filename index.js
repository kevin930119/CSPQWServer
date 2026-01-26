const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter, User } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID 并实现用户注册
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    const openId = req.headers["x-wx-openid"];
    try {
      // 检查用户是否已存在
      let user = await User.findOne({ where: { open_id: openId } });
      
      // 如果用户不存在，创建新用户
      if (!user) {
        user = await User.create({
          open_id: openId,
          nickname: "", // 初始化为空，后续可通过其他接口更新
          icon: "", // 初始化为空，后续可通过其他接口更新
          rank: 0, // 初始等级为1
        });
      }
      
      // 返回用户信息
      res.send({
        code: 0,
        data: {
          open_id: user.open_id,
          nickname: user.nickname,
          icon: user.icon,
          rank: user.rank,
        },
      });
    } catch (error) {
      console.error("用户注册失败:", error);
      res.send({
        code: 500,
        message: "用户注册失败",
      });
    }
  } else {
    res.send({
      code: 400,
      message: "无效的请求",
    });
  }
});



const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
