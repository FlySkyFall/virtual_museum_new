const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let uploadPath = 'public/uploads/';
        
        if (file.fieldname === 'photo') {
            uploadPath += 'persons/';
        } else if (file.fieldname === 'buttonImage') {
            uploadPath += 'buttons/';
        } else if (file.fieldname === 'artifactImage') {
            uploadPath += 'artifacts/';
        }
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware для проверки авторизации
const requireAuth = async (req, res, next) => {
    if (!req.session || !req.session.adminId) {
        return res.redirect('/admin/login');
    }
    next();
};

// Страница входа
router.get('/login', (req, res) => {
    res.render('admin/login', { layout: false, error: null });
});

// Обработка входа
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.render('admin/login', { layout: false, error: 'Неверное имя пользователя или пароль' });
        }
        
        const isValid = await admin.comparePassword(password);
        
        if (!isValid) {
            return res.render('admin/login', { layout: false, error: 'Неверное имя пользователя или пароль' });
        }
        
        req.session.adminId = admin._id;
        req.session.adminUsername = admin.username;
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.render('admin/login', { layout: false, error: 'Ошибка сервера' });
    }
});

// Выход
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Главная страница админки
router.get('/', requireAuth, async (req, res) => {
    try {
        const persons = await Person.find({ hallId: 1 }).sort({ order: 1 });
        const activePersons = persons.filter(p => p.isActive).length;
        const totalArtifacts = persons.reduce((sum, p) => sum + p.artifacts.length, 0);
        
        res.render('admin/index', { 
            layout: false,
            title: 'Панель управления',
            persons: persons,
            activePersons: activePersons,
            totalArtifacts: totalArtifacts,
            admin: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки страницы');
    }
});

// Создание персоналии
router.get('/person/create', requireAuth, (req, res) => {
    res.render('admin/person-form', { 
        layout: false,
        title: 'Добавить персоналию',
        person: null,
        action: '/admin/person'
    });
});

router.post('/person', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const personData = JSON.parse(req.body.personData);
        
        // Проверяем обязательные поля
        if (!personData.fullName || !personData.lastName || !personData.firstName || !personData.birthYear) {
            return res.status(400).send('Заполните все обязательные поля');
        }
        
        const person = new Person({
            ...personData,
            photoPath: req.files['photo'] ? '/uploads/persons/' + req.files['photo'][0].filename : '/images/persons/placeholder.jpg',
            buttonImagePath: req.files['buttonImage'] ? '/uploads/buttons/' + req.files['buttonImage'][0].filename : '/images/literary-hall/person-placeholder.png',
            hallId: 1,
            order: personData.order || (await Person.countDocuments({ hallId: 1 }) + 1)
        });
        
        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при создании персоналии: ' + error.message);
    }
});

// Редактирование персоналии
router.get('/person/:id/edit', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        res.render('admin/person-form', { 
            layout: false,
            title: 'Редактировать персоналию',
            person: person,
            action: `/admin/person/${req.params.id}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки страницы');
    }
});

router.post('/person/:id', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const personData = JSON.parse(req.body.personData);
        const person = await Person.findById(req.params.id);
        
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        // Обновляем данные
        person.fullName = personData.fullName;
        person.lastName = personData.lastName;
        person.firstName = personData.firstName;
        person.patronymic = personData.patronymic;
        person.birthYear = personData.birthYear;
        person.deathYear = personData.deathYear || null;
        person.shortBio = personData.shortBio;
        person.biography = personData.biography;
        person.order = personData.order;
        person.isActive = personData.isActive;
        
        if (req.files['photo']) {
            person.photoPath = '/uploads/persons/' + req.files['photo'][0].filename;
        }
        
        if (req.files['buttonImage']) {
            person.buttonImagePath = '/uploads/buttons/' + req.files['buttonImage'][0].filename;
        }
        
        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при обновлении персоналии: ' + error.message);
    }
});

// Удаление персоналии
router.delete('/person/:id', requireAuth, async (req, res) => {
    try {
        const person = await Person.findByIdAndDelete(req.params.id);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Персоналия не найдена' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Добавление артефакта
router.post('/person/:personId/artifact', requireAuth, upload.single('artifactImage'), async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        const artifactData = JSON.parse(req.body.artifactData);
        const artifact = {
            ...artifactData,
            imagePath: req.file ? '/uploads/artifacts/' + req.file.filename : '/images/artifacts/placeholder.jpg'
        };
        
        person.artifacts.push(artifact);
        await person.save();
        
        res.redirect(`/admin/person/${req.params.personId}/edit`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при добавлении артефакта: ' + error.message);
    }
});

// Редактирование артефакта
router.put('/person/:personId/artifact/:artifactId', requireAuth, upload.single('artifactImage'), async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
        if (artifactIndex === -1) {
            return res.status(404).send('Артефакт не найден');
        }
        
        const artifactData = JSON.parse(req.body.artifactData);
        person.artifacts[artifactIndex] = {
            ...person.artifacts[artifactIndex].toObject(),
            ...artifactData
        };
        
        if (req.file) {
            person.artifacts[artifactIndex].imagePath = '/uploads/artifacts/' + req.file.filename;
        }
        
        await person.save();
        res.redirect(`/admin/person/${req.params.personId}/edit`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при обновлении артефакта: ' + error.message);
    }
});

// Удаление артефакта
router.delete('/person/:personId/artifact/:artifactId', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Персоналия не найдена' });
        }
        
        person.artifacts = person.artifacts.filter(a => a._id.toString() !== req.params.artifactId);
        await person.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;