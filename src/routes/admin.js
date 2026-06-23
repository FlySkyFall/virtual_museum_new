const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ----- Настройка multer с дисковым хранилищем -----
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/others';
    if (file.fieldname === 'photo') folder = 'uploads/persons';
    else if (file.fieldname === 'buttonImage') folder = 'uploads/buttons';
    else if (file.fieldname === 'artifactImage') folder = 'uploads/artifacts';
    // Создаём папку, если её нет
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя: fieldname + временная метка + оригинальное расширение
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ----- Middleware авторизации -----
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
};

// ----- Вход и выход -----
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

// ----- Главная админки -----
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

// ----- Создание персоналии (форма) -----
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
    }
  });
});

router.post('/person', requireAuth, upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'buttonImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const personData = JSON.parse(req.body.personData);

    let photoPath = '/images/persons/placeholder.jpg';
    let buttonImagePath = '/images/literary-hall/person-placeholder.png';

    if (req.files && req.files['photo'] && req.files['photo'][0]) {
      const file = req.files['photo'][0];
      photoPath = '/uploads/persons/' + file.filename;
    }
    if (req.files && req.files['buttonImage'] && req.files['buttonImage'][0]) {
      const file = req.files['buttonImage'][0];
      buttonImagePath = '/uploads/buttons/' + file.filename;
    }

    const person = new Person({
      ...personData,
      photoPath,
      buttonImagePath,
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

// ----- Редактирование персоналии (форма) -----
router.get('/person/:id/edit', requireAuth, async (req, res) => {
  try {
    const person = await Person.findById(req.params.id).lean();
    if (!person) return res.status(404).send('Персоналия не найдена');
    res.render('admin/person-form', {
      layout: false,
      title: 'Редактировать персоналию',
      person
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
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).send('Персоналия не найдена');

    const personData = JSON.parse(req.body.personData);

    // Обновляем основные поля
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
    if (req.files && req.files['photo'] && req.files['photo'][0]) {
      const file = req.files['photo'][0];
      person.photoPath = '/uploads/persons/' + file.filename;
    }
    // Если загружена новая кнопка – обновляем путь
    if (req.files && req.files['buttonImage'] && req.files['buttonImage'][0]) {
      const file = req.files['buttonImage'][0];
      person.buttonImagePath = '/uploads/buttons/' + file.filename;
    }

    await person.save();
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при обновлении персоналии: ' + error.message);
  }
});

// ----- Удаление персоналии -----
router.delete('/person/:id', requireAuth, async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    if (!person) return res.status(404).json({ success: false, error: 'Не найдена' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----- Работа с артефактами -----

// Добавление артефакта
router.post('/person/:personId/artifact', requireAuth, upload.single('artifactImage'), async (req, res) => {
  try {
    const person = await Person.findById(req.params.personId);
    if (!person) return res.status(404).send('Персоналия не найдена');

    const artifactData = JSON.parse(req.body.artifactData);
    let imagePath = '/images/artifacts/placeholder.jpg';

    if (req.file) {
      imagePath = '/uploads/artifacts/' + req.file.filename;
    }

    const artifact = {
      ...artifactData,
      imagePath
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
    if (!person) return res.status(404).send('Персоналия не найдена');

    const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
    if (artifactIndex === -1) return res.status(404).send('Артефакт не найден');

    const artifactData = JSON.parse(req.body.artifactData);
    // Обновляем поля артефакта
    person.artifacts[artifactIndex].name = artifactData.name;
    person.artifacts[artifactIndex].description = artifactData.description;
    person.artifacts[artifactIndex].year = artifactData.year || null;
    person.artifacts[artifactIndex].material = artifactData.material || null;
    person.artifacts[artifactIndex].dimensions = artifactData.dimensions || null;
    person.artifacts[artifactIndex].videoUrl = artifactData.videoUrl || null;

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
    if (!person) return res.status(404).json({ success: false, error: 'Персоналия не найдена' });

    person.artifacts = person.artifacts.filter(a => a._id.toString() !== req.params.artifactId);
    await person.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----- Отладка -----
router.get('/debug', requireAuth, async (req, res) => {
  try {
    const persons = await Person.find({});
    res.json({
      total: persons.length,
      persons: persons.map(p => ({
        id: p._id,
        fullName: p.fullName,
        buttonImagePath: p.buttonImagePath,
        photoPath: p.photoPath,
        isActive: p.isActive,
        artifactsCount: p.artifacts ? p.artifacts.length : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;