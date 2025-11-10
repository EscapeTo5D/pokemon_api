const fs = require('fs');
const path = require('path');

// Vercel serverless function handler
module.exports = (req, res) => {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 读取宝可梦数据
    const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/t_pokemon.json'), 'utf8'));
    const detailData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/t_pokemon_detail.json'), 'utf8'));

    // 获取查询参数
    const {
      page,
      limit,
      nameZh,
      nameJa,
      nameEn,
      type,
      generation
    } = req.query;

    // 判断是否需要分页
    const hasPagination = page !== undefined || limit !== undefined;

    // 设置默认值或使用用户指定的值
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;

    // 过滤数据
    let filteredData = [...pokemonData];

    // 按中文名称搜索
    if (nameZh) {
      filteredData = filteredData.filter(pokemon =>
        pokemon.name_zh.includes(nameZh)
      );
    }

    // 按日文名称搜索
    if (nameJa) {
      const nameJaLower = nameJa.toLowerCase();
      filteredData = filteredData.filter(pokemon =>
        pokemon.name_ja.toLowerCase().includes(nameJaLower)
      );
    }

    // 按英文名称搜索
    if (nameEn) {
      const nameEnLower = nameEn.toLowerCase();
      filteredData = filteredData.filter(pokemon =>
        pokemon.name_en.toLowerCase().includes(nameEnLower)
      );
    }

    // 按类型过滤
    if (type) {
      filteredData = filteredData.filter(pokemon =>
        pokemon.type1 === type || pokemon.type2 === type
      );
    }

    // 按世代过滤
    if (generation) {
      filteredData = filteredData.filter(pokemon =>
        pokemon.generation === parseInt(generation)
      );
    }

    // 根据是否有分页参数决定如何返回数据
    if (hasPagination) {
      // 有分页参数 - 执行分页逻辑
      const total = filteredData.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      // 获取当前页数据并合并图片URL
      const pokemons = filteredData.slice(startIndex, endIndex).map(pokemon => {
        // 查找对应的详细信息
        const detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
        return {
          ...pokemon,
          image_url: detail ? detail.img_url : null
        };
      });

      // 返回带分页信息的响应
      return res.json({
        success: true,
        data: {
          pokemons,
          pagination: {
            current_page: pageNum,
            total_pages: totalPages,
            total_items: total,
            items_per_page: limitNum,
            has_next: pageNum < totalPages,
            has_prev: pageNum > 1
          }
        }
      });
    } else {
      // 没有分页参数 - 返回所有数据并合并图片URL
      const pokemonsWithImages = filteredData.map(pokemon => {
        // 查找对应的详细信息
        const detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
        return {
          ...pokemon,
          image_url: detail ? detail.img_url : null
        };
      });

      return res.json({
        success: true,
        total: filteredData.length,
        data: pokemonsWithImages
      });
    }

  } catch (error) {
    console.error('读取宝可梦数据时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};