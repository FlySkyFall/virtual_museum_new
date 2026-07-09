const express = require('express');
const router = express.Router();
const HistoricalArtifact = require('../models/HistoricalArtifact');

const ITEMS_PER_PAGE = 2;

router.get('/historical-artifacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const total = await HistoricalArtifact.countDocuments();
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

    // ВАЖНО: добавляем .lean() для получения простых объектов
    const artifacts = await HistoricalArtifact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .lean();

    console.log('📦 Найдено артефактов:', artifacts.length);
    artifacts.forEach((a, i) => {
      console.log(`   Артефакт ${i+1}:`, {
        name: a.name,
        imagePath: a.imagePath,
        videoUrl: a.videoUrl,
        _id: a._id
      });
    });

    // Проверяем, что поля не undefined
    if (artifacts.length > 0) {
      console.log('Первый артефакт (проверка):', JSON.stringify(artifacts[0]));
    }

    res.render('hall/historical-artifacts', {
      layout: 'main',
      title: 'Историческое краеведение',
      artifacts: artifacts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки артефактов:', error);
    res.status(500).send('Ошибка загрузки артефактов');
  }
});

router.get('/historical-artifact-video/:id', async (req, res) => {
  try {
    const artifact = await HistoricalArtifact.findById(req.params.id).lean();
    if (!artifact) {
      return res.status(404).send('Артефакт не найден');
    }
    res.render('hall/historical-video', {
      layout: 'main',
      title: artifact.name,
      artifact: artifact
    });
  } catch (error) {
    console.error('❌ Ошибка загрузки видео:', error);
    res.status(500).send('Ошибка загрузки видео');
  }
});

module.exports = router;