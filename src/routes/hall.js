const express = require('express');
const router = express.Router();
const Person = require('../models/Person');

// Маршрут для зала "Литературное краеведение"
router.get('/literary-local-history', async (req, res) => {
    console.log('Запрос к залу "Литературное краеведение"');
    try {
        const persons = await Person.find({ 
            hallId: 1, 
            isActive: true 
        }).sort({ order: 1 }).lean();
        
        console.log(`Загружено ${persons.length} персоналий из БД`);
        
        const totalPages = Math.ceil(persons.length / 4);
        const currentPage = 1;
        
        res.render('hall/literary-local-history', {
            layout: 'main',
            title: 'Литературное краеведение | Виртуальный музей',
            persons: persons.slice(0, 4), // Первые 4 для начальной загрузки
            currentPage: currentPage,
            totalPages: totalPages || 1,
            hasPrev: false,
            hasNext: totalPages > 1
        });
    } catch (error) {
        console.error('Ошибка при загрузке из БД:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы персоналии
router.get('/person/:id', async (req, res) => {
    try {
        const personId = req.params.id;
        
        const person = await Person.findById(personId).lean();
        
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        console.log(`Загружена персоналия: ${person.fullName}`);
        
        res.render('hall/person', {
            layout: false,
            title: `${person.fullName} | Виртуальный музей`,
            person: person
        });
    } catch (error) {
        console.error('Ошибка при загрузке персоналии:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы артефактов с пагинацией (без случайного перемешивания)
router.get('/artifacts/:personId', async (req, res) => {
    try {
        const personId = req.params.personId;
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // 6 артефактов на странице (3x2)
        
        // Загружаем персоналию с артефактами
        const person = await Person.findById(personId).lean();
        
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        const artifacts = person.artifacts || [];
        const totalArtifacts = artifacts.length;
        const totalPages = Math.ceil(totalArtifacts / limit);
        
        // НЕ перемешиваем артефакты - оставляем в исходном порядке
        // Пагинация
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArtifacts = artifacts.slice(startIndex, endIndex);
        
        console.log(`Загружены артефакты для: ${person.fullName}, страница ${page} из ${totalPages}, показано ${paginatedArtifacts.length} артефактов`);
        
        res.render('hall/artifacts', {
            layout: false,
            title: `Артефакты ${person.fullName} | Виртуальный музей`,
            person: person,
            artifacts: paginatedArtifacts,
            currentPage: page,
            totalPages: totalPages,
            personId: personId
        });
    } catch (error) {
        console.error('Ошибка при загрузке артефактов:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// Маршрут для страницы видео артефакта
router.get('/artifact-video/:personId/:artifactIndex', async (req, res) => {
    try {
        const personId = req.params.personId;
        const artifactIndex = parseInt(req.params.artifactIndex);
        
        const person = await Person.findById(personId).lean();
        
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        const artifacts = person.artifacts || [];
        
        if (artifactIndex >= artifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }
        
        const artifact = artifacts[artifactIndex];
        
        console.log(`Загружено видео для артефакта: ${artifact.name}`);
        
        res.render('hall/artifact-video', {
            layout: false,
            title: `${artifact.name} | Виртуальный музей`,
            person: person,
            artifact: artifact,
            personId: personId,
            artifactIndex: artifactIndex
        });
    } catch (error) {
        console.error('Ошибка при загрузке видео артефакта:', error);
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// API маршрут для получения всех персоналий (JSON)
router.get('/api/persons', async (req, res) => {
    try {
        const persons = await Person.find({ hallId: 1, isActive: true })
            .sort({ order: 1 })
            .lean();
        res.json(persons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API маршрут для получения одной персоналии (JSON)
router.get('/api/person/:id', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id).lean();
        if (!person) {
            return res.status(404).json({ error: 'Персоналия не найдена' });
        }
        res.json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;