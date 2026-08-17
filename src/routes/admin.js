const express = require('express');
const router = express.Router();
const Person = require('../models/Person');

// Middleware для проверки админа (можно добавить позже)
// const isAdmin = require('../middleware/isAdmin');

// ============================================
// ГЛАВНАЯ СТРАНИЦА АДМИНКИ
// ============================================
router.get('/admin', async (req, res) => {
    try {
        const persons = await Person.find({ hallId: 1 })
            .sort({ order: 1 })
            .lean();
        
        res.render('admin/index', {
            layout: 'admin',
            title: 'Админ-панель - Литературное краеведение',
            persons: persons
        });
    } catch (error) {
        console.error('Ошибка загрузки админки:', error);
        res.status(500).send('Ошибка загрузки админ-панели');
    }
});

// ============================================
// ДОБАВЛЕНИЕ ПЕРСОНАЛИИ
// ============================================
router.get('/admin/person/add', (req, res) => {
    res.render('admin/person-form', {
        layout: 'admin',
        title: 'Добавить персоналию',
        person: null,
        isEdit: false
    });
});

router.post('/admin/person/add', async (req, res) => {
    try {
        const {
            fullName,
            lastName,
            firstName,
            patronymic,
            birthYear,
            deathYear,
            photoPath,
            buttonImagePath,
            titleImagePath,
            biography,
            shortBio,
            order
        } = req.body;

        const person = new Person({
            fullName,
            lastName,
            firstName,
            patronymic: patronymic || null,
            birthYear: parseInt(birthYear),
            deathYear: deathYear ? parseInt(deathYear) : null,
            photoPath: photoPath || '/images/persons/placeholder.jpg',
            buttonImagePath: buttonImagePath || '/images/literary-hall/person-placeholder.png',
            titleImagePath: titleImagePath || '/images/literary-hall/person-title.png',
            biography,
            shortBio,
            hallId: 1,
            order: parseInt(order) || 0,
            isActive: true
        });

        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка добавления персоналии:', error);
        res.status(500).send('Ошибка добавления персоналии');
    }
});

// ============================================
// РЕДАКТИРОВАНИЕ ПЕРСОНАЛИИ
// ============================================
router.get('/admin/person/edit/:id', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id).lean();
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        res.render('admin/person-form', {
            layout: 'admin',
            title: 'Редактировать персоналию',
            person: person,
            isEdit: true
        });
    } catch (error) {
        console.error('Ошибка загрузки персоналии:', error);
        res.status(500).send('Ошибка загрузки персоналии');
    }
});

router.post('/admin/person/edit/:id', async (req, res) => {
    try {
        const {
            fullName,
            lastName,
            firstName,
            patronymic,
            birthYear,
            deathYear,
            photoPath,
            buttonImagePath,
            titleImagePath,
            biography,
            shortBio,
            order,
            isActive
        } = req.body;

        await Person.findByIdAndUpdate(req.params.id, {
            fullName,
            lastName,
            firstName,
            patronymic: patronymic || null,
            birthYear: parseInt(birthYear),
            deathYear: deathYear ? parseInt(deathYear) : null,
            photoPath: photoPath || '/images/persons/placeholder.jpg',
            buttonImagePath: buttonImagePath || '/images/literary-hall/person-placeholder.png',
            titleImagePath: titleImagePath || '/images/literary-hall/person-title.png',
            biography,
            shortBio,
            order: parseInt(order) || 0,
            isActive: isActive === 'on' ? true : false
        });

        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка обновления персоналии:', error);
        res.status(500).send('Ошибка обновления персоналии');
    }
});

// ============================================
// УДАЛЕНИЕ ПЕРСОНАЛИИ
// ============================================
router.post('/admin/person/delete/:id', async (req, res) => {
    try {
        await Person.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка удаления персоналии:', error);
        res.status(500).send('Ошибка удаления персоналии');
    }
});

// ============================================
// УПРАВЛЕНИЕ АРТЕФАКТАМИ
// ============================================

// Добавление артефакта
router.get('/admin/person/:id/artifact/add', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id).lean();
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        res.render('admin/artifact-form', {
            layout: 'admin',
            title: 'Добавить артефакт',
            person: person,
            artifact: null,
            isEdit: false
        });
    } catch (error) {
        console.error('Ошибка загрузки формы артефакта:', error);
        res.status(500).send('Ошибка загрузки формы');
    }
});

router.post('/admin/person/:id/artifact/add', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }

        const {
            name,
            description,
            imagePath,
            videoUrl,
            videoId,
            year,
            material,
            dimensions
        } = req.body;

        person.artifacts.push({
            name,
            description,
            imagePath: imagePath || '/images/artifacts/artifact1.png',
            videoUrl: videoUrl || null,
            videoId: videoId || null,
            year: year ? parseInt(year) : null,
            material: material || null,
            dimensions: dimensions || null
        });

        await person.save();
        res.redirect(`/admin/person/edit/${person._id}`);
    } catch (error) {
        console.error('Ошибка добавления артефакта:', error);
        res.status(500).send('Ошибка добавления артефакта');
    }
});

// Редактирование артефакта
router.get('/admin/person/:id/artifact/edit/:artifactIndex', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id).lean();
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }

        const artifactIndex = parseInt(req.params.artifactIndex);
        if (artifactIndex >= person.artifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }

        const artifact = person.artifacts[artifactIndex];
        res.render('admin/artifact-form', {
            layout: 'admin',
            title: 'Редактировать артефакт',
            person: person,
            artifact: artifact,
            artifactIndex: artifactIndex,
            isEdit: true
        });
    } catch (error) {
        console.error('Ошибка загрузки артефакта:', error);
        res.status(500).send('Ошибка загрузки артефакта');
    }
});

router.post('/admin/person/:id/artifact/edit/:artifactIndex', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }

        const artifactIndex = parseInt(req.params.artifactIndex);
        if (artifactIndex >= person.artifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }

        const {
            name,
            description,
            imagePath,
            videoUrl,
            videoId,
            year,
            material,
            dimensions
        } = req.body;

        person.artifacts[artifactIndex] = {
            ...person.artifacts[artifactIndex].toObject(),
            name,
            description,
            imagePath: imagePath || '/images/artifacts/artifact1.png',
            videoUrl: videoUrl || null,
            videoId: videoId || null,
            year: year ? parseInt(year) : null,
            material: material || null,
            dimensions: dimensions || null
        };

        await person.save();
        res.redirect(`/admin/person/edit/${person._id}`);
    } catch (error) {
        console.error('Ошибка обновления артефакта:', error);
        res.status(500).send('Ошибка обновления артефакта');
    }
});

// Удаление артефакта
router.post('/admin/person/:id/artifact/delete/:artifactIndex', async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }

        const artifactIndex = parseInt(req.params.artifactIndex);
        if (artifactIndex >= person.artifacts.length) {
            return res.status(404).send('Артефакт не найден');
        }

        person.artifacts.splice(artifactIndex, 1);
        await person.save();

        res.redirect(`/admin/person/edit/${person._id}`);
    } catch (error) {
        console.error('Ошибка удаления артефакта:', error);
        res.status(500).send('Ошибка удаления артефакта');
    }
});

module.exports = router;