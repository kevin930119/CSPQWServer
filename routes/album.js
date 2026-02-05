const express = require('express');
const { Album, AlbumImage, UserAlbumImage, User, sequelize } = require('../db');

const router = express.Router();

// 获取图鉴列表，支持分页加载
router.get('/albums', async (req, res) => {
  try {
    // 获取分页参数，默认值为第1页，每页10条
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 获取用户open_id
    const userOpenId = req.query.open_id;
    
    // 查询图鉴列表
    const { rows, count } = await Album.findAndCountAll({
      limit: pageSize,
      offset: offset,
      order: [['updatedAt', 'DESC']], // 按更新时间戳倒序排列，最新的在最前面
    });
    
    // 构造返回数据
    const albums = [];
    for (const album of rows) {
      // 查询该图鉴下的所有图片
      const images = await AlbumImage.findAll({ where: { parent_id: album.id } });
      const imageIds = images.map(img => img.id);
      
      // 查询用户已完成的图片数量
      let completedCount = 0;
      if (userOpenId) {
        const completedImages = await UserAlbumImage.findAll({
          where: {
            user_open_id: userOpenId,
            album_image_id: imageIds,
            completed: true,
          },
        });
        completedCount = completedImages.length;
      }
      
      albums.push({
        id: album.id,
        name: album.name,
        type: album.type,
        cover: album.cover,
        total: album.total,
        completed: completedCount, // 返回已完成的图片数量
      });
    }
    
    res.send({
      code: 0,
      data: {
        list: albums,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: count,
        },
      },
    });
  } catch (error) {
    console.error('获取图鉴列表失败:', error);
    res.send({
      code: 500,
      message: '获取图鉴列表失败',
    });
  }
});

// 获取对应图鉴里面的图片列表，支持分页加载
router.get('/album/images', async (req, res) => {
  try {
    // 获取参数
    const parentId = req.query.parent_id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 获取用户open_id
    const userOpenId = req.query.open_id;
    
    // 验证参数
    if (!parentId) {
      return res.send({
        code: 400,
        message: '缺少图鉴ID参数',
      });
    }
    
    // 查询图鉴图片列表
    const { rows, count } = await AlbumImage.findAndCountAll({
      where: { parent_id: parentId },
      limit: pageSize,
      offset: offset,
      order: [['level', 'ASC']], // 按等级升序排列
    });
    
    // 构造返回数据
    const images = [];
    for (const image of rows) {
      // 查询用户是否已完成该图片
      let isCompleted = false;
      if (userOpenId) {
        const userImage = await UserAlbumImage.findOne({
          where: {
            user_open_id: userOpenId,
            album_image_id: image.id,
            completed: true,
          },
        });
        isCompleted = !!userImage;
      }
      
      images.push({
        id: image.id,
        parent_id: image.parent_id,
        name: image.name,
        level: image.level,
        list_cover: image.list_cover,
        pic: image.pic,
        type: image.type,
        completed: isCompleted, // 返回是否已完成
      });
    }
    
    res.send({
      code: 0,
      data: {
        list: images,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: count,
        },
      },
    });
  } catch (error) {
    console.error('获取图鉴图片列表失败:', error);
    res.send({
      code: 500,
      message: '获取图鉴图片列表失败',
    });
  }
});

// 标记图片为已完成
router.post('/album/image/complete', async (req, res) => {
  try {
    // 获取参数
    const { image_id } = req.body;
    const userOpenId = req.query.open_id;
    
    // 验证参数
    if (!userOpenId) {
      return res.send({
        code: 400,
        message: '用户未登录',
      });
    }
    
    if (!image_id) {
      return res.send({
        code: 400,
        message: '缺少图片ID参数',
      });
    }
    
    // 检查图片是否存在
    const image = await AlbumImage.findByPk(image_id);
    if (!image) {
      return res.send({
        code: 404,
        message: '图片不存在',
      });
    }
    
    // 检查用户是否存在
    const user = await User.findOne({ where: { open_id: userOpenId } });
    if (!user) {
      return res.send({
        code: 404,
        message: '用户不存在',
      });
    }
    
    // 检查是否已标记为完成
    const existingUserImage = await UserAlbumImage.findOne({
      where: {
        user_open_id: userOpenId,
        album_image_id: image_id,
      },
    });
    
    // 如果已经标记为完成，直接返回成功
    if (existingUserImage && existingUserImage.completed) {
      return res.send({
        code: 0,
        message: '已经标记为完成',
      });
    }
    
    // 开启事务
    const result = await sequelize.transaction(async (t) => {
      // 标记图片为完成
      let userImage;
      if (existingUserImage) {
        // 更新状态
        userImage = await existingUserImage.update(
          { completed: true },
          { transaction: t }
        );
      } else {
        // 创建新记录
        userImage = await UserAlbumImage.create(
          {
            user_open_id: userOpenId,
            album_image_id: image_id,
            completed: true,
          },
          { transaction: t }
        );
      }
      
      // 用户rank+1
      await user.increment('rank', { by: 1, transaction: t });
      
      return userImage;
    });
    
    // 获取更新后的用户信息
    const updatedUser = await User.findOne({ where: { open_id: userOpenId } });
    
    res.send({
      code: 0,
      message: '标记成功',
      data: {
        rank: updatedUser.rank,
      },
    });
  } catch (error) {
    console.error('标记图片完成失败:', error);
    res.send({
      code: 500,
      message: '标记图片完成失败',
    });
  }
});

module.exports = router;