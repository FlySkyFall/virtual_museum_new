const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка Handlebars
app.engine('handlebars', engine({
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    defaultLayout: 'main',
    helpers: {
        eq: function(a, b) { return a === b; },
        add: function(a, b) { return a + b; },
        gt: function(a, b) { return a > b; },
        lt: function(a, b) { return a < b; },
        split: function(str, separator) {
            if (!str) return [];
            return str.split(separator);
        },
        isString: function(str) {
            return typeof str === 'string' && str.length > 0;
        }
    },
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }
}));

// Статические файлы - ВАЖНО для Render
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public'))); // общий fallback

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// Импорт маршрутов
const indexRoutes = require('./routes/index');
const hallRoutes = require('./routes/hall');
const adminRoutes = require('./routes/admin');

// Использование маршрутов
app.use('/', indexRoutes);
app.use('/hall', hallRoutes);
app.use('/admin', adminRoutes);

// Обработка 404 - должна быть после всех маршрутов
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>404 - Страница не найдена</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                h1 { font-size: 72px; margin: 0; }
                a { color: white; text-decoration: none; border: 2px solid white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-top: 20px; }
                a:hover { background: white; color: #667eea; }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Страница не найдена</p>
            <a href="/">Вернуться на главную</a>
        </body>
        </html>
    `);
});

// Обработка ошибок сервера
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).send('Внутренняя ошибка сервера');
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});