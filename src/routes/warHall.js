const express = require('express');
const router = express.Router();
const MilitarySection = require('../models/MilitarySection');

// Маршрут для зала "Военно-исторический"
router.get('/war-history', async (req, res) => {
    console.log('Запрос к залу "Военно-исторический"');
    try {
        const sections = await MilitarySection.find({ 
            hallId: 2, 
            isActive: true 
        }).sort({ order: 1 }).lean();
        
        console.log(`Загружено ${sections.length} разделов из БД`);
        
        res.render('hall/war-history', {
            layout: 'main',
            title: 'Военно-исторический зал | Виртуальный музей',
            sections: sections
        });
    } catch (error) {
        console.error('Ошибка при загрузке из БД:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы раздела
router.get('/military-section/:id', async (req, res) => {
    try {
        const sectionId = req.params.id;
        
        const section = await MilitarySection.findById(sectionId).lean();
        
        if (!section) {
            return res.status(404).send('Раздел не найден');
        }
        
        console.log(`Загружен раздел: ${section.title}`);
        
        res.render('hall/military-section', {
            layout: false,
            title: `${section.title} | Виртуальный музей`,
            section: section
        });
    } catch (error) {
        console.error('Ошибка при загрузке раздела:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы артефактов с пагинацией
router.get('/military-artifacts/:sectionId', async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // 6 артефактов на странице (3x2)
        
        // Загружаем раздел с артефактами
        const section = await MilitarySection.findById(sectionId).lean();
        
        if (!section) {
            return res.status(404).send('Раздел не найден');
        }
        
        const artifacts = section.artifacts || [];
        const totalArtifacts = artifacts.length;
        const totalPages = Math.ceil(totalArtifacts / limit);
        
        // Пагинация
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArtifacts = artifacts.slice(startIndex, endIndex);
        
        console.log(`Загружены артефакты для раздела: ${section.title}, страница ${page} из ${totalPages}, показано ${paginatedArtifacts.length} артефактов`);
        
        res.render('hall/military-artifacts', {
            layout: false,
            title: `Артефакты ${section.title} | Виртуальный музей`,
            section: section,
            artifacts: paginatedArtifacts,
            currentPage: page,
            totalPages: totalPages,
            sectionId: sectionId
        });
    } catch (error) {
        console.error('Ошибка при загрузке артефактов:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы видео артефакта
router.get('/military-artifact-video/:sectionId/:artifactIndex', async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        const artifactIndex = parseInt(req.params.artifactIndex);
        
        const section = await MilitarySection.findById(sectionId).lean();
        
        if (!section) {
            return res.status(404).send('Раздел не найден');
        }
        
        const artifacts = section.artifacts || [];
        
        if (artifactIndex >= artifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }
        
        const artifact = artifacts[artifactIndex];
        
        console.log(`Загружено видео для артефакта: ${artifact.name}`);
        
        res.render('hall/military-artifact-video', {
            layout: false,
            title: `${artifact.name} | Виртуальный музей`,
            section: section,
            artifact: artifact,
            sectionId: sectionId,
            artifactIndex: artifactIndex
        });
    } catch (error) {
        console.error('Ошибка при загрузке видео артефакта:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// API маршрут для получения всех разделов (JSON)
router.get('/api/military-sections', async (req, res) => {
    try {
        const sections = await MilitarySection.find({ hallId: 2, isActive: true })
            .sort({ order: 1 })
            .lean();
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API маршрут для получения одного раздела (JSON)
router.get('/api/military-section/:id', async (req, res) => {
    try {
        const section = await MilitarySection.findById(req.params.id).lean();
        if (!section) {
            return res.status(404).json({ error: 'Раздел не найден' });
        }
        res.json(section);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;