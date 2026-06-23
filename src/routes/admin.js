const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const multer = require('multer');
const { uploadAndPublish } = require('../utils/yandexDisk');

// Настройка multer для приёма файлов в память (буфер)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Middleware авторизации (без изменений)
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
};

// ----- Вход и выход (без изменений) -----
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

// ----- Главная админки (без изменений) -----
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
      artifacts: []
    }
  });
});

router.post('/person', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const personData = JSON.parse(req.body.personData);
    let photoPath = '/images/persons/placeholder.jpg';

    if (req.file) {
      // Загружаем на Яндекс.Диск
      photoPath = await uploadAndPublish(req.file.buffer, req.file.originalname, 'persons');
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

router.post('/person/:id', requireAuth, upload.single('photo'), async (req, res) => {
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

    // Если загружено новое фото – обновляем путь через Яндекс.Диск
    if (req.file) {
      person.photoPath = await uploadAndPublish(req.file.buffer, req.file.originalname, 'persons');
    }

    await person.save();
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при обновлении персоналии: ' + error.message);
  }
});

// ----- Удаление персоналии (без изменений) -----
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
router.post('/person/:personId/artifact', requireAuth, upload.single('artifactImage'), async (req, res) => {
  try {
    const person = await Person.findById(req.params.personId);
    if (!person) return res.status(404).send('Персоналия не найдена');

    const artifactData = JSON.parse(req.body.artifactData);
    let imagePath = '/images/artifacts/placeholder.jpg';

    if (req.file) {
      imagePath = await uploadAndPublish(req.file.buffer, req.file.originalname, 'artifacts');
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

router.put('/person/:personId/artifact/:artifactId', requireAuth, upload.single('artifactImage'), async (req, res) => {
  try {
    const person = await Person.findById(req.params.personId);
    if (!person) return res.status(404).send('Персоналия не найдена');

    const artifactIndex = person.artifacts.findIndex(a => a._id.toString() === req.params.artifactId);
    if (artifactIndex === -1) return res.status(404).send('Артефакт не найден');

    const artifactData = JSON.parse(req.body.artifactData);
    person.artifacts[artifactIndex].name = artifactData.name;
    person.artifacts[artifactIndex].description = artifactData.description;
    person.artifacts[artifactIndex].year = artifactData.year || null;
    person.artifacts[artifactIndex].material = artifactData.material || null;
    person.artifacts[artifactIndex].dimensions = artifactData.dimensions || null;
    person.artifacts[artifactIndex].videoUrl = artifactData.videoUrl || null;

    if (req.file) {
      person.artifacts[artifactIndex].imagePath = await uploadAndPublish(req.file.buffer, req.file.originalname, 'artifacts');
    }

    await person.save();
    res.redirect(`/admin/person/${req.params.personId}/edit`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при обновлении артефакта');
  }
});

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

// ----- Отладка (без изменений) -----
router.get('/debug', requireAuth, async (req, res) => {
  try {
    const persons = await Person.find({});
    res.json({
      total: persons.length,
      persons: persons.map(p => ({
        id: p._id,
        fullName: p.fullName,
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