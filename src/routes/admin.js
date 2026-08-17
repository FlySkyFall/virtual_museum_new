const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Admin = require('../models/Admin');
const { isAdmin, isNotAuthenticated } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ============================================
// МАРШРУТЫ АУТЕНТИФИКАЦИИ
// ============================================

// Страница входа
router.get('/admin/login', isNotAuthenticated, (req, res) => {
    const error = req.query.error;
    res.render('admin/login', {
        layout: false,
        title: 'Вход в админ-панель',
        error: error
    });
});

// Обработка входа
router.post('/admin/login', isNotAuthenticated, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Ищем пользователя по username или email
        const admin = await Admin.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });
        
        if (!admin) {
            return res.redirect('/admin/login?error=invalid_credentials');
        }
        
        if (!admin.isActive) {
            return res.redirect('/admin/login?error=account_disabled');
        }
        
        // Проверяем пароль
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.redirect('/admin/login?error=invalid_credentials');
        }
        
        // Создаем сессию
        req.session.adminId = admin._id;
        req.session.adminUsername = admin.username;
        
        // Обновляем время последнего входа
        admin.lastLogin = new Date();
        await admin.save();
        
        // Перенаправляем на страницу, с которой пришли, или на главную админки
        const returnTo = req.session.returnTo || '/admin';
        delete req.session.returnTo;
        res.redirect(returnTo);
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        res.redirect('/admin/login?error=server_error');
    }
});

// Выход из системы
router.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Ошибка выхода:', err);
        }
        res.redirect('/admin/login');
    });
});

// Страница регистрации (только для первого администратора)
router.get('/admin/register', isNotAuthenticated, async (req, res) => {
    try {
        // Проверяем, есть ли уже администраторы
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.redirect('/admin/login');
        }
        res.render('admin/register', {
            layout: false,
            title: 'Регистрация администратора'
        });
    } catch (error) {
        console.error('Ошибка загрузки страницы регистрации:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка регистрации (только для первого администратора)
router.post('/admin/register', isNotAuthenticated, async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(403).send('Регистрация запрещена. Администратор уже существует.');
        }
        
        const { username, email, password, confirmPassword } = req.body;
        
        // Проверка совпадения паролей
        if (password !== confirmPassword) {
            return res.redirect('/admin/register?error=passwords_mismatch');
        }
        
        // Создаем администратора
        const admin = new Admin({
            username,
            email,
            password
        });
        
        await admin.save();
        
        res.redirect('/admin/login?registered=true');
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        if (error.code === 11000) {
            return res.redirect('/admin/register?error=duplicate');
        }
        res.redirect('/admin/register?error=server_error');
    }
});

// Страница профиля
router.get('/admin/profile', isAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId).select('-password');
        res.render('admin/profile', {
            layout: 'admin',
            title: 'Мой профиль',
            admin: admin
        });
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        res.status(500).send('Ошибка загрузки профиля');
    }
});

// Обновление профиля
router.post('/admin/profile', isAdmin, async (req, res) => {
    try {
        const { email, currentPassword, newPassword, confirmPassword } = req.body;
        const admin = await Admin.findById(req.session.adminId);
        
        // Обновляем email
        if (email && email !== admin.email) {
            admin.email = email;
        }
        
        // Обновляем пароль, если указан
        if (newPassword) {
            if (!currentPassword) {
                return res.redirect('/admin/profile?error=current_password_required');
            }
            
            const isMatch = await admin.comparePassword(currentPassword);
            if (!isMatch) {
                return res.redirect('/admin/profile?error=invalid_current_password');
            }
            
            if (newPassword !== confirmPassword) {
                return res.redirect('/admin/profile?error=passwords_mismatch');
            }
            
            admin.password = newPassword;
        }
        
        await admin.save();
        res.redirect('/admin/profile?success=updated');
        
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.redirect('/admin/profile?error=update_failed');
    }
});

// ============================================
// ЗАЩИЩЕННЫЕ МАРШРУТЫ АДМИНКИ
// ============================================

// ГЛАВНАЯ СТРАНИЦА АДМИНКИ (защищена)
router.get('/admin', isAdmin, async (req, res) => {
    try {
        const persons = await Person.find({ hallId: 1 })
            .sort({ order: 1 })
            .lean();
        
        res.render('admin/index', {
            layout: 'admin',
            title: 'Админ-панель - Литературное краеведение',
            persons: persons,
            admin: req.admin
        });
    } catch (error) {
        console.error('Ошибка загрузки админки:', error);
        res.status(500).send('Ошибка загрузки админ-панели');
    }
});

// ДОБАВЛЕНИЕ ПЕРСОНАЛИИ (защищено)
router.get('/admin/person/add', isAdmin, (req, res) => {
    res.render('admin/person-form', {
        layout: 'admin',
        title: 'Добавить персоналию',
        person: null,
        isEdit: false,
        admin: req.admin
    });
});

router.post('/admin/person/add', isAdmin, async (req, res) => {
    try {
        console.log('Добавление персоналии, данные:', req.body);
        
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
            fullName: fullName.trim(),
            lastName: lastName.trim(),
            firstName: firstName.trim(),
            patronymic: patronymic ? patronymic.trim() : null,
            birthYear: parseInt(birthYear),
            deathYear: deathYear ? parseInt(deathYear) : null,
            photoPath: photoPath || '/images/persons/placeholder.jpg',
            buttonImagePath: buttonImagePath || '/images/literary-hall/person-placeholder.png',
            titleImagePath: titleImagePath || '/images/literary-hall/person-title.png',
            biography: biography.trim(),
            shortBio: shortBio.trim(),
            hallId: 1,
            order: parseInt(order) || 0,
            isActive: true
        });

        await person.save();
        console.log('Персоналия добавлена:', person._id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка добавления персоналии:', error);
        res.status(500).send('Ошибка добавления персоналии: ' + error.message);
    }
});

// РЕДАКТИРОВАНИЕ ПЕРСОНАЛИИ (защищено)
router.get('/admin/person/edit/:id', isAdmin, async (req, res) => {
    try {
        console.log('Загрузка персоналии для редактирования:', req.params.id);
        const person = await Person.findById(req.params.id).lean();
        if (!person) {
            return res.status(404).send('Персоналия не найдена');
        }
        res.render('admin/person-form', {
            layout: 'admin',
            title: 'Редактировать персоналию',
            person: person,
            isEdit: true,
            admin: req.admin
        });
    } catch (error) {
        console.error('Ошибка загрузки персоналии:', error);
        res.status(500).send('Ошибка загрузки персоналии');
    }
});

router.post('/admin/person/edit/:id', isAdmin, async (req, res) => {
    try {
        console.log('Обновление персоналии:', req.params.id);
        console.log('Данные:', req.body);
        
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

        const updateData = {
            fullName: fullName.trim(),
            lastName: lastName.trim(),
            firstName: firstName.trim(),
            patronymic: patronymic ? patronymic.trim() : null,
            birthYear: parseInt(birthYear),
            deathYear: deathYear ? parseInt(deathYear) : null,
            photoPath: photoPath || '/images/persons/placeholder.jpg',
            buttonImagePath: buttonImagePath || '/images/literary-hall/person-placeholder.png',
            titleImagePath: titleImagePath || '/images/literary-hall/person-title.png',
            biography: biography.trim(),
            shortBio: shortBio.trim(),
            order: parseInt(order) || 0,
            isActive: isActive === 'on' ? true : false
        };

        const result = await Person.findByIdAndUpdate(
            req.params.id, 
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!result) {
            return res.status(404).send('Персоналия не найдена');
        }
        
        console.log('Персоналия обновлена:', result._id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка обновления персоналии:', error);
        res.status(500).send('Ошибка обновления персоналии: ' + error.message);
    }
});

// УДАЛЕНИЕ ПЕРСОНАЛИИ (защищено)
router.post('/admin/person/delete/:id', isAdmin, async (req, res) => {
    try {
        console.log('Удаление персоналии:', req.params.id);
        await Person.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Ошибка удаления персоналии:', error);
        res.status(500).send('Ошибка удаления персоналии');
    }
});

// УПРАВЛЕНИЕ АРТЕФАКТАМИ (защищено)

// Добавление артефакта
router.get('/admin/person/:id/artifact/add', isAdmin, async (req, res) => {
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
            isEdit: false,
            admin: req.admin
        });
    } catch (error) {
        console.error('Ошибка загрузки формы артефакта:', error);
        res.status(500).send('Ошибка загрузки формы');
    }
});

router.post('/admin/person/:id/artifact/add', isAdmin, async (req, res) => {
    try {
        console.log('Добавление артефакта для персоналии:', req.params.id);
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
            name: name.trim(),
            description: description.trim(),
            imagePath: imagePath || '/images/artifacts/artifact1.png',
            videoUrl: videoUrl || null,
            videoId: videoId || null,
            year: year ? parseInt(year) : null,
            material: material || null,
            dimensions: dimensions || null
        });

        await person.save();
        console.log('Артефакт добавлен');
        res.redirect(`/admin/person/edit/${person._id}`);
    } catch (error) {
        console.error('Ошибка добавления артефакта:', error);
        res.status(500).send('Ошибка добавления артефакта');
    }
});

// Редактирование артефакта
router.get('/admin/person/:id/artifact/edit/:artifactIndex', isAdmin, async (req, res) => {
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
            isEdit: true,
            admin: req.admin
        });
    } catch (error) {
        console.error('Ошибка загрузки артефакта:', error);
        res.status(500).send('Ошибка загрузки артефакта');
    }
});

router.post('/admin/person/:id/artifact/edit/:artifactIndex', isAdmin, async (req, res) => {
    try {
        console.log('Обновление артефакта для персоналии:', req.params.id);
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

        const artifact = person.artifacts[artifactIndex];
        artifact.name = name.trim();
        artifact.description = description.trim();
        artifact.imagePath = imagePath || '/images/artifacts/artifact1.png';
        artifact.videoUrl = videoUrl || null;
        artifact.videoId = videoId || null;
        artifact.year = year ? parseInt(year) : null;
        artifact.material = material || null;
        artifact.dimensions = dimensions || null;

        await person.save();
        console.log('Артефакт обновлен');
        res.redirect(`/admin/person/edit/${person._id}`);
    } catch (error) {
        console.error('Ошибка обновления артефакта:', error);
        res.status(500).send('Ошибка обновления артефакта');
    }
});

// Удаление артефакта
router.post('/admin/person/:id/artifact/delete/:artifactIndex', isAdmin, async (req, res) => {
    try {
        console.log('Удаление артефакта для персоналии:', req.params.id);
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