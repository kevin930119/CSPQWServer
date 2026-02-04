const express = require('express');
const { User } = require('../db');

const router = express.Router();

// 小程序调用，获取微信 Open ID 并实现用户注册
router.get('/wx_openid', async (req, res) => {
  if (req.headers['x-wx-source']) {
    const openId = req.headers['x-wx-openid'];
    try {
      // 检查用户是否已存在
      let user = await User.findOne({ where: { open_id: openId } });
      
      // 如果用户不存在，创建新用户
      if (!user) {
        user = await User.create({
          open_id: openId,
          nickname: '', // 初始化为空，后续可通过其他接口更新
          icon: '', // 初始化为空，后续可通过其他接口更新
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
      console.error('用户注册失败:', error);
      res.send({
        code: 500,
        message: '用户注册失败',
      });
    }
  } else {
    res.send({
      code: 400,
      message: '无效的请求',
    });
  }
});

module.exports = router;