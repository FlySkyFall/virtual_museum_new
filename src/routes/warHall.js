const express = require('express');
const router = express.Router();

// Статичные разделы военно-исторического зала
const sections = [
    {
        id: 'ww2',
        title: 'Великая Отечественная война',
        route: '/hall/war-section/ww2',
        buttonImagePath: '/images/war-hall/ww2-button.jpg'
    },
    {
        id: 'local-conflicts',
        title: 'Локальные конфликты',
        route: '/hall/war-section/local-conflicts',
        buttonImagePath: '/images/war-hall/local-conflicts-button.jpg'
    },
    {
        id: 'svo',
        title: 'Специальная военная операция',
        route: '/hall/war-section/svo',
        buttonImagePath: '/images/war-hall/svo-button.jpg'
    }
];

// Маршрут для зала "Военно-исторический"
router.get('/war-history', (req, res) => {
    console.log('Запрос к залу "Военно-исторический"');
    
    res.render('hall/war-history', {
        layout: 'main',
        title: 'Военно-исторический зал | Виртуальный музей',
        sections: sections
    });
});

// Маршрут для страницы раздела (заглушка)
router.get('/war-section/:sectionId', (req, res) => {
    const sectionId = req.params.sectionId;
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
        return res.status(404).send('Раздел не найден');
    }
    
    console.log(`Загружен раздел: ${section.title}`);
    
    // Здесь можно загружать артефакты из БД или использовать статичные данные
    res.render('hall/war-section', {
        layout: false,
        title: `${section.title} | Виртуальный музей`,
        section: section
    });
});

module.exports = router;