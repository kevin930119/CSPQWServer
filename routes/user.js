const express = require('express');
const { User, Album, AlbumImage, UserAlbumImage } = require('../db');

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

// 获取排行榜
router.get('/rank', async (req, res) => {
  try {
    // 查询前50名用户，按rank降序排序
    const users = await User.findAll({
      limit: 50,
      order: [['rank', 'DESC']],
      attributes: ['icon', 'nickname', 'rank'],
    });
    
    // 构造返回数据
    const rankList = users.map((user, index) => ({
      rank: index + 1, // 排行榜名次
      user: {
        icon: user.icon,
        nickname: user.nickname,
        score: user.rank, // 分数
      },
    }));
    
    res.send({
      code: 0,
      data: {
        list: rankList,
      },
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.send({
      code: 500,
      message: '获取排行榜失败',
    });
  }
});

// 获取用户最近一次已完成的图鉴信息
router.get('/recent_album', async (req, res) => {
  try {
    // 获取用户open_id
    const userOpenId = req.query.open_id;
    
    // 验证参数
    if (!userOpenId) {
      return res.send({
        code: 400,
        message: '用户未登录',
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
    
    // 获取用户已完成的图鉴图片，按id降序排列，取最近的一条
    const recentCompletedImage = await UserAlbumImage.findOne({
      where: {
        user_open_id: userOpenId,
        completed: true,
      },
      order: [['id', 'DESC']],
    });
    
    // 如果没有已完成的图片，返回空
    if (!recentCompletedImage) {
      return res.send({
        code: 0,
        data: null,
      });
    }
    
    // 获取该图片所属的图鉴图片
    const albumImage = await AlbumImage.findByPk(recentCompletedImage.album_image_id);
    if (!albumImage) {
      return res.send({
        code: 404,
        message: '图片不存在',
      });
    }
    
    // 获取图鉴信息
    const album = await Album.findByPk(albumImage.parent_id);
    if (!album) {
      return res.send({
        code: 404,
        message: '图鉴不存在',
      });
    }
    
    // 获取该图鉴下的所有图片，按level升序排列
    const allImages = await AlbumImage.findAll({
      where: { parent_id: album.id },
      order: [['level', 'ASC']],
    });
    
    // 计算最近完成的图片在列表中的下标
    const imageIndex = allImages.findIndex(img => img.id === albumImage.id);
    
    // 构造返回数据
    const result = {
      album: {
        id: album.id,
        name: album.name,
        total: album.total,
      },
      image: {
        id: albumImage.id,
        parent_id: albumImage.parent_id,
        name: albumImage.name,
        level: albumImage.level,
        list_cover: albumImage.list_cover,
        pic: albumImage.pic,
        type: albumImage.type,
      },
      image_index: imageIndex,
    };
    
    res.send({
      code: 0,
      data: result,
    });
  } catch (error) {
    console.error('获取最近完成的图鉴信息失败:', error);
    res.send({
      code: 500,
      message: '获取最近完成的图鉴信息失败',
    });
  }
});

module.exports = router;