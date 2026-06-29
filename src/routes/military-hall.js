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

// Страница с артефактами войны (с пагинацией)
router.get('/military-history/war/:warId', async (req, res) => {
    try {
        const warId = req.params.warId;
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // 5 артефактов на страницу
        
        console.log(`Запрос артефактов для войны ID: ${warId}, страница: ${page}`);
        
        const war = await War.findById(warId).lean();
        
        if (!war) {
            console.log('Война не найдена');
            return res.status(404).send('Война не найдена');
        }
        
        // Фильтруем активные артефакты
        const activeArtifacts = war.artifacts.filter(a => a.isActive);
        const totalArtifacts = activeArtifacts.length;
        const totalPages = Math.ceil(totalArtifacts / limit) || 1;
        
        // Пагинация
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalArtifacts);
        const paginatedArtifacts = activeArtifacts.slice(startIndex, endIndex);
        
        console.log(`Война: ${war.name}`);
        console.log(`Всего артефактов: ${totalArtifacts}`);
        console.log(`Всего страниц: ${totalPages}`);
        console.log(`Текущая страница: ${page}`);
        console.log(`Показано артефактов: ${paginatedArtifacts.length}`);
        
        res.render('hall/war-artifacts', {
            layout: false,
            title: `${war.name} | Виртуальный музей`,
            war: war,
            artifacts: paginatedArtifacts,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Ошибка при загрузке артефактов войны:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Страница с видео артефакта
router.get('/military-history/war/:warId/artifact/:artifactIndex', async (req, res) => {
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
        
        res.render('hall/military-artifact-video', {
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