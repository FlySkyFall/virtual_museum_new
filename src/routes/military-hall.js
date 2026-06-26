const express = require('express');
const router = express.Router();
const War = require('../models/War');

// ============================================
// МАРШРУТЫ ДЛЯ ВОЕННО-ИСТОРИЧЕСКОГО ЗАЛА
// Путь: /hall/military-history
// ============================================

// Главная страница военного зала
router.get('/military-history', async (req, res) => {
    console.log('Запрос к залу "Военно-историческое краеведение"');
    try {
        const wars = await War.find({ isActive: true })
            .sort({ order: 1 })
            .lean();
        
        console.log(`Загружено ${wars.length} войн из БД`);
        
        res.render('hall/military-history', {
            layout: 'main',
            title: 'Военно-историческое краеведение | Виртуальный музей',
            wars: wars
        });
    } catch (error) {
        console.error('Ошибка при загрузке из БД:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Страница с артефактами конкретной войны
router.get('/military-history/war/:warId', async (req, res) => {
    try {
        const warId = req.params.warId;
        
        const war = await War.findById(warId).lean();
        
        if (!war) {
            return res.status(404).send('Война не найдена');
        }
        
        const activeArtifacts = war.artifacts.filter(a => a.isActive);
        
        console.log(`Загружена война: ${war.name}, артефактов: ${activeArtifacts.length}`);
        
        res.render('hall/war-artifacts', {
            layout: false,
            title: `${war.name} | Виртуальный музей`,
            war: war,
            artifacts: activeArtifacts
        });
    } catch (error) {
        console.error('Ошибка при загрузке артефактов войны:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// API для военного зала
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

module.exports = router;