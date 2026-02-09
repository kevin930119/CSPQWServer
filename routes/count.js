const express = require('express');
const { Counter } = require('../db');

const router = express.Router();

// 更新计数
router.post('/count', async (req, res) => {
  const { action } = req.body;
  if (action === 'inc') {
    await Counter.create();
  } else if (action === 'clear') {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    message: '操作成功',
    data: await Counter.count(),
  });
});

// 获取计数
router.get('/count', async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    message: '获取成功',
    data: result,
  });
});

module.exports = router;