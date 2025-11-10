const fs = require('fs');
const path = require('path');

// 读取宝可梦数据
const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/t_pokemon.json'), 'utf8'));

/**
 * 获取宝可梦列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getPokemonList(req, res) {
  try {
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

      // 获取当前页数据
      const pokemons = filteredData.slice(startIndex, endIndex);

      // 返回带分页信息的响应
      res.json({
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
      // 没有分页参数 - 返回所有数据
      res.json({
        success: true,
        data: {
          pokemons: filteredData,
          total_count: filteredData.length
        }
      });
    }

  } catch (error) {
    console.error('获取宝可梦列表时出错:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
}

/**
 * 获取单个宝可梦详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getPokemonById(req, res) {
  try {
    const { id } = req.params;
    const pokemon = pokemonData.find(p => p.id === parseInt(id) || p.idx === parseInt(id));

    if (!pokemon) {
      return res.status(404).json({
        success: false,
        error: '宝可梦未找到'
      });
    }

    res.json({
      success: true,
      data: pokemon
    });

  } catch (error) {
    console.error('获取宝可梦详情时出错:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
}

/**
 * 获取所有类型列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getTypes(req, res) {
  try {
    const types = new Set();

    pokemonData.forEach(pokemon => {
      if (pokemon.type1) types.add(pokemon.type1);
      if (pokemon.type2) types.add(pokemon.type2);
    });

    res.json({
      success: true,
      data: Array.from(types).sort()
    });

  } catch (error) {
    console.error('获取类型列表时出错:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
}

/**
 * 获取所有世代列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getGenerations(req, res) {
  try {
    const generations = [...new Set(pokemonData.map(pokemon => pokemon.generation))].sort();

    res.json({
      success: true,
      data: generations
    });

  } catch (error) {
    console.error('获取世代列表时出错:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
}

// 导出处理函数
module.exports = {
  getPokemonList,
  getPokemonById,
  getTypes,
  getGenerations,
  pokemonData // 导出数据供其他模块使用
};