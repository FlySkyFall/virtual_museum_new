const express = require('express');
const router = express.Router();
const HistoricalArtifact = require('../models/HistoricalArtifact');

const ITEMS_PER_PAGE = 2;

// Список артефактов с пагинацией
router.get('/historical-artifacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const total = await HistoricalArtifact.countDocuments();
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

    const artifacts = await HistoricalArtifact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    // imagePath уже есть в модели, просто передаём как есть
    res.render('hall/historical-artifacts', {
      layout: 'main',
      title: 'Историческое краеведение',
      artifacts: artifacts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка загрузки артефактов');
  }
});

// Страница просмотра видео
router.get('/historical-artifact-video/:id', async (req, res) => {
  try {
    const artifact = await HistoricalArtifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).send('Артефакт не найден');
    }
    res.render('hall/historical-video', {
      layout: 'main',
      title: artifact.name,
      artifact: artifact
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка загрузки видео');
  }
});

module.exports = router;