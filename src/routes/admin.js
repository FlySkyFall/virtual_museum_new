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
        let uploadPath = 'src/public/uploads/';
        
        // Создаем папку если её нет
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
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

const upload = multer({ storage: storage });

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
        res.render('admin/index', { 
            layout: 'admin',
            title: 'Панель управления',
            persons: persons,
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
        layout: 'admin',
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
        
        const person = new Person({
            ...personData,
            photoPath: req.files['photo'] ? '/uploads/persons/' + req.files['photo'][0].filename : '/images/persons/placeholder.jpg',
            buttonImagePath: req.files['buttonImage'] ? '/uploads/buttons/' + req.files['buttonImage'][0].filename : '/images/literary-hall/person-placeholder.png',
            hallId: 1,
            order: await Person.countDocuments() + 1
        });
        
        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при создании персоналии');
    }
});

// Редактирование персоналии
router.get('/person/:id/edit', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        res.render('admin/person-form', { 
            layout: 'admin',
            title: 'Редактировать персоналию',
            person: person,
            action: `/admin/person/${req.params.id}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки страницы');
    }
});

router.put('/person/:id', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const personData = JSON.parse(req.body.personData);
        const person = await Person.findById(req.params.id);
        
        person.fullName = personData.fullName;
        person.lastName = personData.lastName;
        person.firstName = personData.firstName;
        person.patronymic = personData.patronymic;
        person.birthYear = personData.birthYear;
        person.deathYear = personData.deathYear || null;
        person.shortBio = personData.shortBio;
        person.biography = personData.biography;
        person.order = personData.order;
        person.isActive = personData.isActive === 'true' || personData.isActive === true;
        
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
        res.status(500).send('Ошибка при обновлении персоналии');
    }
});

// Удаление персоналии
router.delete('/person/:id', requireAuth, async (req, res) => {
    try {
        await Person.findByIdAndDelete(req.params.id);
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
        res.status(500).send('Ошибка при добавлении артефакта');
    }
});

// Редактирование артефакта
router.put('/person/:personId/artifact/:artifactId', requireAuth, upload.single('artifactImage'), async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
        
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
        res.status(500).send('Ошибка при обновлении артефакта');
    }
});

// Удаление артефакта
router.delete('/person/:personId/artifact/:artifactId', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        person.artifacts = person.artifacts.filter(a => a._id.toString() !== req.params.artifactId);
        await person.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;