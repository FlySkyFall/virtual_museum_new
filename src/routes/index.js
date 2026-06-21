const express = require('express');
const router = express.Router();

// Данные для трех залов музея
const halls = [
    {
        id: 1,
        name: 'Литературное краеведение',
        description: 'Знакомство с писателями и поэтами нашего края',
        route: '/hall/literary-local-history',
        position: { top: '5%', left: '20%' }, // Левый верхний угол
        width: '300px',
        height: '220px'
    },
    {
        id: 2,
        name: 'Военно исторический зал',
        description: 'Знакомство с локальными и мировыми военными конфликтами',
        route: '/hall/war-history',
        position: { top: '6%', left: '69%' }, // Правый верхний угол со смещением
        width: '300px',
        height: '220px'
    },
    {
        id: 3,
        name: 'Зал Космоса',
        description: 'Тайны Вселенной и космические приключения',
        route: '/hall/space',
        position: { top: '65%', left: '65%' }, // Правый нижний угол со смещением
        width: '300px',
        height: '220px'
    }
];

// Главная страница
router.get('/', (req, res) => {
    res.render('home', {
        layout: 'main',
        title: 'Виртуальный музей детских библиотек',
        halls: halls
    });
});

module.exports = router;