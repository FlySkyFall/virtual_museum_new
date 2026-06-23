// routes/admin.js
const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== НАСТРОЙКА MULTER ====================

// Создаем директории для загрузки, если их нет
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Настройка хранилища для фото персоналий
const personStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images/persons';
        ensureDirectoryExists(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Настройка хранилища для артефактов
const artifactStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images/artifacts';
        ensureDirectoryExists(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Настройка хранилища для кнопок
const buttonStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/images/literary-hall';
        ensureDirectoryExists(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Создаем upload middleware
const uploadPersonPhoto = multer({ 
    storage: personStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
}).single('photo');

const uploadButtonImage = multer({ 
    storage: buttonStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
}).single('buttonImage');

const uploadArtifactImage = multer({ 
    storage: artifactStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
}).single('artifactImage');

// Middleware авторизации
const requireAuth = async (req, res, next) => {
    if (!req.session || !req.session.adminId) {
        return res.redirect('/admin/login');
    }
    next();
};

// ==================== ЛОГИН ====================

router.get('/login', (req, res) => {
    res.render('admin/login', { layout: false, error: null });
});

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

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// ==================== ГЛАВНАЯ ====================

router.get('/', requireAuth, async (req, res) => {
    try {
        const persons = await Person.find({}).sort({ order: 1 }).lean();
        const activePersons = persons.filter(p => p.isActive).length;
        const totalArtifacts = persons.reduce((sum, p) => sum + (p.artifacts ? p.artifacts.length : 0), 0);

        res.render('admin/index', {
            layout: false,
            title: 'Панель управления',
            persons,
            activePersons,
            totalArtifacts
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки страницы');
    }
});

// ==================== СОЗДАНИЕ ПЕРСОНАЛИИ ====================

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
        isEdit: false
    });
});

router.post('/person', requireAuth, uploadPersonPhoto, async (req, res) => {
    try {
        const personData = JSON.parse(req.body.personData);
        let photoPath = '/images/persons/placeholder.jpg';
        
        if (req.file) {
            photoPath = '/images/persons/' + req.file.filename;
        }

        const person = new Person({
            ...personData,
            photoPath,
            hallId: 1,
            order: personData.order || (await Person.countDocuments() + 1),
            artifacts: []
        });

        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при создании персоналии: ' + error.message);
    }
});

// ==================== РЕДАКТИРОВАНИЕ ПЕРСОНАЛИИ ====================

router.get('/person/:id/edit', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.id).lean();
        if (!person) return res.status(404).send('Персоналия не найдена');
        res.render('admin/person-form', {
            layout: false,
            title: 'Редактировать персоналию',
            person,
            isEdit: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка загрузки страницы');
    }
});

router.post('/person/:id', requireAuth, uploadPersonPhoto, async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) return res.status(404).send('Персоналия не найдена');

        const personData = JSON.parse(req.body.personData);

        // Обновляем все поля
        person.fullName = personData.fullName;
        person.lastName = personData.lastName;
        person.firstName = personData.firstName;
        person.patronymic = personData.patronymic || '';
        person.birthYear = personData.birthYear;
        person.deathYear = personData.deathYear || null;
        person.shortBio = personData.shortBio || '';
        person.biography = personData.biography || '';
        person.order = personData.order || 0;
        person.isActive = personData.isActive === true || personData.isActive === 'true';

        // Если загружено новое фото – обновляем путь
        if (req.file) {
            // Удаляем старое фото, если оно не стандартное
            if (person.photoPath && person.photoPath !== '/images/persons/placeholder.jpg') {
                const oldPath = path.join('public', person.photoPath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            person.photoPath = '/images/persons/' + req.file.filename;
        }

        await person.save();
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при обновлении персоналии: ' + error.message);
    }
});

// ==================== УДАЛЕНИЕ ПЕРСОНАЛИИ ====================

router.delete('/person/:id', requireAuth, async (req, res) => {
    try {
        const person = await Person.findById(req.params.id);
        if (!person) return res.status(404).json({ success: false, error: 'Не найдена' });

        // Удаляем фото персоналии
        if (person.photoPath && person.photoPath !== '/images/persons/placeholder.jpg') {
            const photoPath = path.join('public', person.photoPath);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Удаляем все фото артефактов
        if (person.artifacts && person.artifacts.length > 0) {
            person.artifacts.forEach(artifact => {
                if (artifact.imagePath && !artifact.imagePath.includes('placeholder')) {
                    const artifactPath = path.join('public', artifact.imagePath);
                    if (fs.existsSync(artifactPath)) {
                        fs.unlinkSync(artifactPath);
                    }
                }
            });
        }

        await Person.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ЗАГРУЗКА ФОТО ДЛЯ КНОПКИ ====================

router.post('/person/:personId/button-image', requireAuth, uploadButtonImage, async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) return res.status(404).send('Персоналия не найдена');

        if (req.file) {
            // Удаляем старую картинку кнопки
            if (person.buttonImagePath && person.buttonImagePath !== '/images/literary-hall/person-placeholder.png') {
                const oldPath = path.join('public', person.buttonImagePath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            person.buttonImagePath = '/images/literary-hall/' + req.file.filename;
            await person.save();
        }

        res.redirect(`/admin/person/${req.params.personId}/edit`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при загрузке изображения для кнопки');
    }
});

// ==================== РАБОТА С АРТЕФАКТАМИ ====================

// Добавление артефакта
router.post('/person/:personId/artifact', requireAuth, uploadArtifactImage, async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) return res.status(404).send('Персоналия не найдена');

        const artifactData = JSON.parse(req.body.artifactData);
        let imagePath = '/images/artifacts/placeholder.jpg';

        if (req.file) {
            imagePath = '/images/artifacts/' + req.file.filename;
        }

        const artifact = { ...artifactData, imagePath };
        person.artifacts.push(artifact);
        await person.save();
        res.redirect(`/admin/person/${req.params.personId}/edit`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при добавлении артефакта');
    }
});

// Редактирование артефакта
router.post('/person/:personId/artifact/:artifactId', requireAuth, uploadArtifactImage, async (req, res) => {
    try {
        const person = await Person.findById(req.params.personId);
        if (!person) return res.status(404).send('Персоналия не найдена');

        const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
        if (artifactIndex === -1) return res.status(404).send('Артефакт не найден');

        const artifactData = JSON.parse(req.body.artifactData);
        
        // Обновляем данные артефакта
        person.artifacts[artifactIndex].name = artifactData.name;
        person.artifacts[artifactIndex].description = artifactData.description;
        person.artifacts[artifactIndex].year = artifactData.year || null;
        person.artifacts[artifactIndex].material = artifactData.material || null;
        person.artifacts[artifactIndex].dimensions = artifactData.dimensions || null;
        person.artifacts[artifactIndex].videoUrl = artifactData.videoUrl || null;

        // Если загружено новое изображение
        if (req.file) {
            // Удаляем старое изображение
            const oldImagePath = person.artifacts[artifactIndex].imagePath;
            if (oldImagePath && !oldImagePath.includes('placeholder')) {
                const oldPath = path.join('public', oldImagePath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            person.artifacts[artifactIndex].imagePath = '/images/artifacts/' + req.file.filename;
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
        if (!person) return res.status(404).json({ success: false, error: 'Персоналия не найдена' });

        const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
        if (artifactIndex === -1) return res.status(404).json({ success: false, error: 'Артефакт не найден' });

        // Удаляем изображение артефакта
        const artifact = person.artifacts[artifactIndex];
        if (artifact.imagePath && !artifact.imagePath.includes('placeholder')) {
            const imagePath = path.join('public', artifact.imagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        person.artifacts.splice(artifactIndex, 1);
        await person.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ОТЛАДКА ====================

router.get('/debug', requireAuth, async (req, res) => {
    try {
        const persons = await Person.find({});
        res.json({
            total: persons.length,
            persons: persons.map(p => ({
                id: p._id,
                fullName: p.fullName,
                photoPath: p.photoPath,
                buttonImagePath: p.buttonImagePath,
                isActive: p.isActive,
                artifactsCount: p.artifacts ? p.artifacts.length : 0
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;