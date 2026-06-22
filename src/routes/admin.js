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
    limits: { fileSize: 10 * 1024 * 1024 }
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
        // Находим ВСЕХ персоналий
        const persons = await Person.find({}).sort({ order: 1 });
        
        console.log('=== ЗАПРОС К АДМИНКЕ ===');
        console.log('Найдено персоналий:', persons.length);
        
        // Выводим информацию о каждой персоналии
        persons.forEach((p, index) => {
            console.log(`${index + 1}. ${p.fullName} (ID: ${p._id}) - Активен: ${p.isActive}, Артефактов: ${p.artifacts ? p.artifacts.length : 0}`);
        });
        
        const activePersons = persons.filter(p => p.isActive).length;
        const totalArtifacts = persons.reduce((sum, p) => sum + (p.artifacts ? p.artifacts.length : 0), 0);
        
        res.render('admin/index', { 
            layout: false,
            title: 'Панель управления',
            persons: persons,
            activePersons: activePersons,
            totalArtifacts: totalArtifacts,
            admin: true
        });
    } catch (error) {
        console.error('Ошибка загрузки страницы:', error);
        res.status(500).send('Ошибка загрузки страницы: ' + error.message);
    }
});

// Создание персоналии
router.get('/person/create', requireAuth, (req, res) => {
    res.render('admin/person-form', { 
        layout: false,
        title: 'Добавить персоналию',
        person: {
            _id: null,
            fullName: '',
            lastName: '',
            firstName: '',
            patronymic: '',
            birthYear: '',
            deathYear: null,
            shortBio: '',
            biography: '',
            order: 0,
            isActive: true,
            photoPath: '/images/persons/placeholder.jpg',
            buttonImagePath: '/images/literary-hall/person-placeholder.png',
            artifacts: []
        },
        action: '/admin/person'
    });
});

router.post('/person', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Создание персоналии');
        const personData = JSON.parse(req.body.personData);
        
        const person = new Person({
            ...personData,
            photoPath: req.files && req.files['photo'] ? '/uploads/persons/' + req.files['photo'][0].filename : '/images/persons/placeholder.jpg',
            buttonImagePath: req.files && req.files['buttonImage'] ? '/uploads/buttons/' + req.files['buttonImage'][0].filename : '/images/literary-hall/person-placeholder.png',
            hallId: 1,
            order: personData.order || (await Person.countDocuments() + 1),
            artifacts: []
        });
        
        await person.save();
        console.log('Создана персоналия:', person.fullName, 'ID:', person._id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка при создании персоналии:', error);
        res.status(500).send('Ошибка при создании персоналии: ' + error.message);
    }
});

// Редактирование персоналии
router.get('/person/:id/edit', requireAuth, async (req, res) => {
    try {
        const personId = req.params.id;
        console.log('Редактирование персоналии с ID:', personId);
        
        const person = await Person.findById(personId);
        if (!person) {
            console.log('Персоналия не найдена с ID:', personId);
            return res.status(404).send('Персоналия не найдена');
        }
        
        console.log('Найдена персоналия:', person.fullName);
        console.log('Артефактов:', person.artifacts ? person.artifacts.length : 0);
        
        res.render('admin/person-form', { 
            layout: false,
            title: 'Редактировать персоналию',
            person: person,
            action: `/admin/person/${personId}`
        });
    } catch (error) {
        console.error('Ошибка загрузки страницы редактирования:', error);
        res.status(500).send('Ошибка загрузки страницы: ' + error.message);
    }
});

router.post('/person/:id', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const personId = req.params.id;
        console.log('Обновление персоналии с ID:', personId);
        
        const personData = JSON.parse(req.body.personData);
        const person = await Person.findById(personId);
        
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
        
        if (req.files && req.files['photo']) {
            person.photoPath = '/uploads/persons/' + req.files['photo'][0].filename;
        }
        
        if (req.files && req.files['buttonImage']) {
            person.buttonImagePath = '/uploads/buttons/' + req.files['buttonImage'][0].filename;
        }
        
        await person.save();
        console.log('Обновлена персоналия:', person.fullName);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка при обновлении персоналии:', error);
        res.status(500).send('Ошибка при обновлении персоналии: ' + error.message);
    }
});

// Удаление персоналии
router.delete('/person/:id', requireAuth, async (req, res) => {
    try {
        const personId = req.params.id;
        console.log('Удаление персоналии с ID:', personId);
        
        const person = await Person.findByIdAndDelete(personId);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Персоналия не найдена' });
        }
        console.log('Удалена персоналия:', person.fullName);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении персоналии:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Добавление артефакта
router.post('/person/:personId/artifact', requireAuth, upload.single('artifactImage'), async (req, res) => {
    try {
        const personId = req.params.personId;
        console.log('Добавление артефакта для персоналии:', personId);
        
        const person = await Person.findById(personId);
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
        
        console.log('Добавлен артефакт:', artifact.name);
        res.redirect(`/admin/person/${personId}/edit`);
    } catch (error) {
        console.error('Ошибка при добавлении артефакта:', error);
        res.status(500).send('Ошибка при добавлении артефакта: ' + error.message);
    }
});

// Редактирование артефакта
router.put('/person/:personId/artifact/:artifactId', requireAuth, upload.single('artifactImage'), async (req, res) => {
    try {
        const personId = req.params.personId;
        const artifactId = req.params.artifactId;
        console.log('Обновление артефакта:', artifactId, 'для персоналии:', personId);
        
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === artifactId);
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
        console.log('Обновлен артефакт:', artifactData.name);
        res.redirect(`/admin/person/${personId}/edit`);
    } catch (error) {
        console.error('Ошибка при обновлении артефакта:', error);
        res.status(500).send('Ошибка при обновлении артефакта: ' + error.message);
    }
});

// Удаление артефакта
router.delete('/person/:personId/artifact/:artifactId', requireAuth, async (req, res) => {
    try {
        const personId = req.params.personId;
        const artifactId = req.params.artifactId;
        console.log('Удаление артефакта:', artifactId, 'для персоналии:', personId);
        
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({ success: false, error: 'Персоналия не найдена' });
        }
        
        person.artifacts = person.artifacts.filter(a => a._id.toString() !== artifactId);
        await person.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении артефакта:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Временный маршрут для отладки - ПОСЛЕ всех других маршрутов
router.get('/debug', requireAuth, async (req, res) => {
    try {
        const persons = await Person.find({});
        console.log('=== ОТЛАДКА БАЗЫ ДАННЫХ ===');
        console.log('Всего записей:', persons.length);
        
        if (persons.length > 0) {
            console.log('Первая запись:', JSON.stringify(persons[0].toObject(), null, 2));
            console.log('Ключи первой записи:', Object.keys(persons[0].toObject()));
        }
        
        res.json({
            total: persons.length,
            sample: persons.length > 0 ? persons[0].toObject() : null,
            all: persons.map(p => ({
                id: p._id,
                fullName: p.fullName,
                lastName: p.lastName,
                firstName: p.firstName,
                isActive: p.isActive,
                artifactsCount: p.artifacts ? p.artifacts.length : 0
            }))
        });
    } catch (error) {
        console.error('Ошибка отладки:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;