const express = require('express');
const router = express.Router();
const War = require('../models/War');

// Главная страница военно-исторического зала
router.get('/', async (req, res) => {
    console.log('Запрос к залу "Военно-историческое краеведение"');
    try {
        // Загружаем все активные войны (всегда 3)
        const wars = await War.find({ isActive: true })
            .sort({ order: 1 })
            .lean();
        
        console.log(`Загружено ${wars.length} войн из БД`);
        
        res.render('hall/military-history', {
            layout: 'main',
            title: 'Военно-историческое краеведение | Виртуальный музей',
            wars: wars // Всегда 3 войны
        });
    } catch (error) {
        console.error('Ошибка при загрузке из БД:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Страница с артефактами конкретной войны
router.get('/war/:warId', async (req, res) => {
    try {
        const warId = req.params.warId;
        
        const war = await War.findById(warId).lean();
        
        if (!war) {
            return res.status(404).send('Война не найдена');
        }
        
        console.log(`Загружена война: ${war.name}`);
        
        res.render('hall/war-artifacts', {
            layout: false,
            title: `${war.name} | Виртуальный музей`,
            war: war,
            artifacts: war.artifacts.filter(a => a.isActive)
        });
    } catch (error) {
        console.error('Ошибка при загрузке артефактов войны:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Страница с видео артефакта
router.get('/artifact/:warId/:artifactIndex', async (req, res) => {
    try {
        const warId = req.params.warId;
        const artifactIndex = parseInt(req.params.artifactIndex);
        
        const war = await War.findById(warId).lean();
        
        if (!war) {
            return res.status(404).send('Война не найдена');
        }
        
        const activeArtifacts = war.artifacts.filter(a => a.isActive);
        
        if (artifactIndex >= activeArtifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }
        
        const artifact = activeArtifacts[artifactIndex];
        
        console.log(`Загружено видео для артефакта: ${artifact.name}`);
        
        res.render('hall/artifact-video', {
            layout: false,
            title: `${artifact.name} | Виртуальный музей`,
            war: war,
            artifact: artifact,
            warId: warId,
            artifactIndex: artifactIndex,
            totalArtifacts: activeArtifacts.length
        });
    } catch (error) {
        console.error('Ошибка при загрузке видео артефакта:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// API маршрут для получения всех войн
router.get('/api/wars', async (req, res) => {
    try {
        const wars = await War.find({ isActive: true })
            .sort({ order: 1 })
            .lean();
        res.json(wars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API маршрут для получения артефактов войны
router.get('/api/war/:warId/artifacts', async (req, res) => {
    try {
        const war = await War.findById(req.params.warId).lean();
        if (!war) {
            return res.status(404).json({ error: 'Война не найдена' });
        }
        
        const activeArtifacts = war.artifacts.filter(a => a.isActive);
        res.json({
            war: war,
            artifacts: activeArtifacts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;