const express = require('express');
const router = express.Router();

// Данные для трех залов музея
const halls = [
    {
        id: 1,
        name: 'Литературное краеведение',
        description: 'Знакомство с писателями и поэтами нашего края',
        route: '/hall/literary-local-history',
        position: { top: '5%', left: '19%' }, // Левый верхний угол
        width: '23%',
        height: '28%'
    },
    {
        id: 2,
        name: 'Военно исторический зал',
        description: 'Знакомство с локальными и мировыми военными конфликтами',
        route: '/hall/military-history',
        position: { top: '6%', left: '69%' }, // Правый верхний угол со смещением
        width: '23%',
        height: '28%'
    },
    {
        id: 3,
        name: 'Коллекция автографов',
        description: 'Дарственные книги',
        route: '/hall/autograf-artifacts',
        position: { top: '70%', left: '12%' }, // Правый нижний угол со смещением
        width: '23%',
        height: '28%'
    },
    {
        id: 4,
        name: 'Историческое краеведение',
        description: 'Знакомство с историческими артефактами',
        route: '/hall/historical-artifacts',
        position: { top: '65%', left: '65%' }, // Правый нижний угол со смещением
        width: '23%',
        height: '28%'
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

// API для поиска
router.get('/api/search', (req, res) => {
    const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
    
    if (!query || query.length < 2) {
        return res.json([]);
    }

    // Данные для поиска
    const searchData = [
        {
            title: 'Литературное краеведение',
            description: 'Знакомство с писателями и поэтами нашего края',
            url: '/hall/literary-local-history',
            keywords: ['литература', 'краеведение', 'писатели', 'поэты']
        },
        {
            title: 'Военно исторический зал',
            description: 'Знакомство с локальными и мировыми военными конфликтами',
            url: '/hall/military-history',
            keywords: ['война', 'история', 'военный', 'конфликт', 'битва']
        },
        {
            title: 'Коллекция автографов',
            description: 'Дарственные книги с автографами',
            url: '/hall/autograf-artifacts',
            keywords: ['автограф', 'книга', 'дарственная', 'подпись']
        },
        {
            title: 'Историческое краеведение',
            description: 'Знакомство с историческими артефактами',
            url: '/hall/historical-artifacts',
            keywords: ['история', 'артефакт', 'краеведение', 'экспонат']
        }
    ];

    // Поиск по заголовкам, описаниям и ключевым словам
    const results = searchData.filter(item => {
        const searchText = (item.title + ' ' + item.description + ' ' + item.keywords.join(' ')).toLowerCase();
        return searchText.includes(query);
    });

    // Сортируем по релевантности (совпадение в заголовке важнее)
    results.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(query);
        const bTitle = b.title.toLowerCase().includes(query);
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        return 0;
    });

    res.json(results);
});

module.exports = router;