const express = require('express');
const homeRouter = require('./home');
const countRouter = require('./count');
const userRouter = require('./user');
const albumRouter = require('./album');

const router = express.Router();

// 注册路由模块
router.use('/', homeRouter);
router.use('/api', countRouter);
router.use('/api', userRouter);
router.use('/api', albumRouter);

module.exports = router;