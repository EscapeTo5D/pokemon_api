const fs = require('fs');
const path = require('path');

// Vercel serverless function handler for pokemon details
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
    // 读取两个数据文件
    const pokemonData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/t_pokemon.json'), 'utf8'));
    const detailData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/t_pokemon_detail.json'), 'utf8'));

    // 获取查询参数
    const { id, idx, nameZh, nameEn, nameJa } = req.query;

    let pokemon = null;
    let detail = null;

    // 按ID查找（精确匹配数据库ID）
    if (id) {
      pokemon = pokemonData.find(p => p.id === parseInt(id));
      if (!pokemon) {
        // 如果没找到，尝试按idx查找（会返回第一个匹配的形态）
        pokemon = pokemonData.find(p => p.idx === parseInt(id));
      }
      if (pokemon) {
        detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
      }
    }
    // 按idx查找（返回第一个匹配的形态）
    else if (idx) {
      pokemon = pokemonData.find(p => p.idx === parseInt(idx));
      if (pokemon) {
        detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
      }
    }
    // 按中文名查找（智能匹配）
    else if (nameZh) {
      // 先尝试精确匹配
      pokemon = pokemonData.find(p => p.name_zh === nameZh);

      // 如果没找到，尝试模糊匹配
      if (!pokemon) {
        const sameNamePokemons = pokemonData.filter(p =>
          p.name_zh.includes(nameZh) || nameZh.includes(p.name_zh)
        );

        // 智能选择：优先无形态版本，否则第一个
        if (sameNamePokemons.length === 1) {
          pokemon = sameNamePokemons[0];
        } else if (sameNamePokemons.length > 1) {
          pokemon = sameNamePokemons.find(p => !p.form || p.form === "") || sameNamePokemons[0];
        }
      }

      if (pokemon) {
        detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
      }
    }
    // 按英文名查找（智能匹配）
    else if (nameEn) {
      const nameEnLower = nameEn.toLowerCase();
      pokemon = pokemonData.find(p => p.name_en.toLowerCase() === nameEnLower);

      if (!pokemon) {
        const sameNamePokemons = pokemonData.filter(p =>
          p.name_en.toLowerCase().includes(nameEnLower) ||
          nameEnLower.includes(p.name_en.toLowerCase())
        );

        if (sameNamePokemons.length === 1) {
          pokemon = sameNamePokemons[0];
        } else if (sameNamePokemons.length > 1) {
          pokemon = sameNamePokemons.find(p => !p.form || p.form === "") || sameNamePokemons[0];
        }
      }

      if (pokemon) {
        detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
      }
    }
    // 按日文名查找（智能匹配）
    else if (nameJa) {
      const nameJaLower = nameJa.toLowerCase();
      pokemon = pokemonData.find(p => p.name_ja.toLowerCase() === nameJaLower);

      if (!pokemon) {
        const sameNamePokemons = pokemonData.filter(p =>
          p.name_ja.toLowerCase().includes(nameJaLower) ||
          nameJaLower.includes(p.name_ja.toLowerCase())
        );

        if (sameNamePokemons.length === 1) {
          pokemon = sameNamePokemons[0];
        } else if (sameNamePokemons.length > 1) {
          pokemon = sameNamePokemons.find(p => !p.form || p.form === "") || sameNamePokemons[0];
        }
      }

      if (pokemon) {
        detail = detailData.find(d => d.id === pokemon.id || d.idx === pokemon.idx);
      }
    }

    if (!pokemon) {
      return res.status(404).json({
        success: false,
        error: '宝可梦未找到，请检查ID或名称是否正确',
        suggestion: '如果查询多形态宝可梦，建议使用具体的数据库ID而不是图鉴号'
      });
    }

    // 查找该宝可梦的所有形态
    const allForms = pokemonData.filter(p => p.idx === pokemon.idx);

    // 合并基础数据和详细数据
    const combinedData = {
      // 基础信息
      id: pokemon.id,
      idx: pokemon.idx,
      name_zh: pokemon.name_zh,
      name_ja: pokemon.name_ja,
      name_en: pokemon.name_en,
      type1: pokemon.type1,
      type2: pokemon.type2,
      form: pokemon.form,
      generation: pokemon.generation,

      // 多形态信息
      has_multiple_forms: allForms.length > 1,
      all_forms: allForms.map(form => ({
        id: form.id,
        type1: form.type1,
        type2: form.type2,
        form: form.form
      })),

      // 详细信息 (如果有)
      ...(detail ? {
        img_url: detail.img_url,
        category: detail.category,
        ability: detail.ability,
        height: detail.height,
        weight: detail.weight,
        body_style: detail.body_style,
        catch_rate: detail.catch_rate,
        gender_ratio: detail.gender_ratio,
        egg_group1: detail.egg_group1,
        egg_group2: detail.egg_group2,
        hatch_time: detail.hatch_time,
        effort_value: detail.effort_value
      } : {})
    };

    // 返回宝可梦详情
    return res.json({
      success: true,
      data: combinedData
    });

  } catch (error) {
    console.error('读取宝可梦详情时出错:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};