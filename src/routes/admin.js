const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Middleware для проверки авторизации
const requireAuth = async (req, res, next) => {
    if (!req.session || !req.session.adminId) {
        return res.redirect('/admin/login');
    }
    next();
};

// Настройка multer для хранения в памяти (buffer)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Функция для сохранения файла в GridFS
const saveToGridFS = (fileBuffer, originalName, fieldname) => {
    return new Promise((resolve, reject) => {
        // Определяем папку
        let folder = 'others';
        if (fieldname === 'photo') folder = 'persons';
        else if (fieldname === 'buttonImage') folder = 'buttons';
        else if (fieldname === 'artifactImage') folder = 'artifacts';
        
        // Генерируем уникальное имя
        crypto.randomBytes(16, (err, buf) => {
            if (err) return reject(err);
            
            const filename = folder + '/' + buf.toString('hex') + path.extname(originalName);
            
            // Создаем bucket
            const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: 'uploads'
            });
            
            // Создаем поток для загрузки
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    fieldname: fieldname,
                    originalName: originalName,
                    folder: folder,
                    uploadDate: new Date()
                }
            });
            
            // Записываем буфер
            uploadStream.write(fileBuffer);
            uploadStream.end();
            
            uploadStream.on('finish', () => {
                resolve(filename);
            });
            
            uploadStream.on('error', (error) => {
                reject(error);
            });
        });
    });
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
        const persons = await Person.find({}).sort({ order: 1 }).lean();
        
        console.log('=== ЗАПРОС К АДМИНКЕ ===');
        console.log('Найдено персоналий:', persons.length);
        
        persons.forEach((p, index) => {
            console.log(`${index + 1}. ${p.fullName} (ID: ${p._id}) - Активен: ${p.isActive}, Артефактов: ${p.artifacts ? p.artifacts.length : 0}`);
        });
        
        const activePersons = persons.filter(p => p.isActive === true).length;
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
        console.log('=== СОЗДАНИЕ ПЕРСОНАЛИИ ===');
        console.log('Файлы:', req.files ? Object.keys(req.files) : 'Нет файлов');

        const personData = JSON.parse(req.body.personData);
        
        let photoPath = '/images/persons/placeholder.jpg';
        let buttonImagePath = '/images/literary-hall/person-placeholder.png';
        
        // Сохраняем фото в GridFS
        if (req.files && req.files['photo'] && req.files['photo'][0]) {
            const file = req.files['photo'][0];
            const filename = await saveToGridFS(file.buffer, file.originalname, 'photo');
            photoPath = '/uploads/' + filename;
            console.log('✅ Сохранен путь к фото:', photoPath);
        }
        
        // Сохраняем кнопку в GridFS
        if (req.files && req.files['buttonImage'] && req.files['buttonImage'][0]) {
            const file = req.files['buttonImage'][0];
            const filename = await saveToGridFS(file.buffer, file.originalname, 'buttonImage');
            buttonImagePath = '/uploads/' + filename;
            console.log('✅ Сохранен путь к кнопке:', buttonImagePath);
        }
        
        const person = new Person({
            ...personData,
            photoPath: photoPath,
            buttonImagePath: buttonImagePath,
            hallId: 1,
            order: personData.order || (await Person.countDocuments() + 1),
            artifacts: []
        });
        
        await person.save();
        console.log('✅ Создана персоналия:', person.fullName, 'ID:', person._id);
        res.redirect('/admin');
    } catch (error) {
        console.error('❌ Ошибка при создании персоналии:', error);
        res.status(500).send('Ошибка при создании персоналии: ' + error.message);
    }
});

// Редактирование персоналии
router.get('/person/:id/edit', requireAuth, async (req, res) => {
    try {
        const personId = req.params.id;
        console.log('Редактирование персоналии с ID:', personId);
        
        const person = await Person.findById(personId).lean();
        
        if (!person) {
            console.log('Персоналия не найдена с ID:', personId);
            return res.status(404).send('Персоналия не найдена');
        }
        
        console.log('Найдена персоналия:', person.fullName);
        console.log('buttonImagePath:', person.buttonImagePath);
        console.log('photoPath:', person.photoPath);
        
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

// Обновление персоналии
router.post('/person/:id', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const personId = req.params.id;
        console.log('=== ОБНОВЛЕНИЕ ПЕРСОНАЛИИ ===');
        console.log('ID персоналии:', personId);
        console.log('Файлы:', req.files ? Object.keys(req.files) : 'Нет файлов');

        if (req.files) {
            if (req.files['photo']) {
                console.log('📸 Фото загружено, размер:', req.files['photo'][0].size);
            }
            if (req.files['buttonImage']) {
                console.log('🖼️ Изображение кнопки загружено, размер:', req.files['buttonImage'][0].size);
            }
        }
        
        if (!req.body.personData) {
            console.error('❌ Нет данных personData в запросе');
            return res.status(400).send('Отсутствуют данные персоналии');
        }
        
        const personData = JSON.parse(req.body.personData);
        const person = await Person.findById(personId);
        
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        console.log('👤 Текущая персоналия:', person.fullName);
        console.log('🖼️ Текущий путь к кнопке:', person.buttonImagePath);

        // Обновляем данные
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
        
        // ОБНОВЛЯЕМ ФОТО, ЕСЛИ ЗАГРУЖЕНО НОВОЕ
        if (req.files && req.files['photo'] && req.files['photo'][0]) {
            const file = req.files['photo'][0];
            const filename = await saveToGridFS(file.buffer, file.originalname, 'photo');
            const oldPhoto = person.photoPath;
            person.photoPath = '/uploads/' + filename;
            console.log('✅ Обновлено фото:');
            console.log('   Было:', oldPhoto);
            console.log('   Стало:', person.photoPath);
        } else {
            console.log('ℹ️ Фото не обновлялось');
        }
        
        // ОБНОВЛЯЕМ КНОПКУ, ЕСЛИ ЗАГРУЖЕНО НОВОЕ ИЗОБРАЖЕНИЕ
        if (req.files && req.files['buttonImage'] && req.files['buttonImage'][0]) {
            const file = req.files['buttonImage'][0];
            const filename = await saveToGridFS(file.buffer, file.originalname, 'buttonImage');
            const oldButton = person.buttonImagePath;
            person.buttonImagePath = '/uploads/' + filename;
            console.log('✅ Обновлена кнопка:');
            console.log('   Было:', oldButton);
            console.log('   Стало:', person.buttonImagePath);
        } else {
            console.log('ℹ️ Кнопка не обновлялась');
        }
        
        await person.save();
        console.log('✅ Персоналия обновлена:', person.fullName);
        res.redirect('/admin');
    } catch (error) {
        console.error('❌ Ошибка при обновлении персоналии:', error);
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
        let imagePath = '/images/artifacts/placeholder.jpg';
        
        if (req.file) {
            const filename = await saveToGridFS(req.file.buffer, req.file.originalname, 'artifactImage');
            imagePath = '/uploads/' + filename;
            console.log('✅ Сохранен артефакт:', imagePath);
        }
        
        const artifact = {
            ...artifactData,
            imagePath: imagePath
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
            const filename = await saveToGridFS(req.file.buffer, req.file.originalname, 'artifactImage');
            person.artifacts[artifactIndex].imagePath = '/uploads/' + filename;
            console.log('✅ Обновлен артефакт:', person.artifacts[artifactIndex].imagePath);
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

// Отладочные маршруты
router.get('/debug', requireAuth, async (req, res) => {
    try {
        const persons = await Person.find({});
        console.log('=== ОТЛАДКА БАЗЫ ДАННЫХ ===');
        console.log('Всего записей:', persons.length);
        
        const result = persons.map(p => ({
            id: p._id,
            fullName: p.fullName,
            buttonImagePath: p.buttonImagePath,
            photoPath: p.photoPath,
            isActive: p.isActive,
            artifactsCount: p.artifacts ? p.artifacts.length : 0
        }));
        
        res.json({
            total: persons.length,
            persons: result
        });
    } catch (error) {
        console.error('Ошибка отладки:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;