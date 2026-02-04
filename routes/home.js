const express = require('express');
const path = require('path');

const router = express.Router();

// 首页
router.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

module.exports = router;