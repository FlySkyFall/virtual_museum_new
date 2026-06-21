const express = require('express');
const router = express.Router();

// Статичные разделы военно-исторического зала
const sections = [
    {
        id: 'ww2',
        title: 'Великая Отечественная война',
        subtitle: '1941-1945',
        buttonImagePath: '/images/war-hall/ww2-button.jpg'
    },
    {
        id: 'local-conflicts',
        title: 'Локальные конфликты',
        subtitle: '1950-2000',
        buttonImagePath: '/images/war-hall/local-conflicts-button.jpg'
    },
    {
        id: 'svo',
        title: 'Специальная военная операция',
        subtitle: '2022-настоящее время',
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

// Маршрут для страницы артефактов с пагинацией
router.get('/military-artifacts/:sectionId', (req, res) => {
    const sectionId = req.params.sectionId;
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // 5 артефактов на странице (3+2 в шахматном порядке)
    
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
        return res.status(404).send('Раздел не найден');
    }
    
    // Получаем артефакты для раздела
    const allArtifacts = getArtifactsForSection(sectionId);
    const totalArtifacts = allArtifacts.length;
    const totalPages = Math.ceil(totalArtifacts / limit);
    
    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArtifacts = allArtifacts.slice(startIndex, endIndex);
    
    console.log(`Загружены артефакты для раздела: ${section.title}, страница ${page} из ${totalPages}, показано ${paginatedArtifacts.length} артефактов`);
    
    res.render('hall/military-artifacts', {
        layout: false,
        title: `Артефакты ${section.title} | Виртуальный музей`,
        section: section,
        artifacts: paginatedArtifacts,
        currentPage: page,
        totalPages: totalPages,
        sectionId: sectionId
    });
});

// Маршрут для страницы видео артефакта
router.get('/military-artifact-video/:sectionId/:artifactIndex', (req, res) => {
    const sectionId = req.params.sectionId;
    const artifactIndex = parseInt(req.params.artifactIndex);
    
    const section = sections.find(s => s.id === sectionId);
    
    if (!section) {
        return res.status(404).send('Раздел не найден');
    }
    
    const allArtifacts = getArtifactsForSection(sectionId);
    
    if (artifactIndex >= allArtifacts.length) {
        return res.status(404).send('Артефакт не найден');
    }
    
    const artifact = allArtifacts[artifactIndex];
    
    console.log(`Загружено видео для артефакта: ${artifact.name}`);
    
    res.render('hall/military-artifact-video', {
        layout: false,
        title: `${artifact.name} | Виртуальный музей`,
        section: section,
        artifact: artifact,
        sectionId: sectionId,
        artifactIndex: artifactIndex
    });
});

// Функция для получения артефактов раздела
function getArtifactsForSection(sectionId) {
    const allArtifacts = {
        'ww2': [
            { name: 'Миномет М-120', description: '120-мм миномет образца 1938 года', imagePath: '/images/artifacts/mortar-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Пулемет Максим', description: 'Станковый пулемет системы Максима', imagePath: '/images/artifacts/maxim-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'ППШ-41', description: 'Пистолет-пулемет Шпагина', imagePath: '/images/artifacts/ppsh-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Винтовка Мосина', description: 'Трехлинейная винтовка образца 1891 года', imagePath: '/images/artifacts/mosin-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Танк Т-34', description: 'Средний танк Т-34', imagePath: '/images/artifacts/t34-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Боевое знамя', description: 'Боевое знамя воинской части', imagePath: '/images/artifacts/banner-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Катюша', description: 'Реактивная установка БМ-13', imagePath: '/images/artifacts/katyusha-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Противотанковое ружье', description: 'ПТРД-41', imagePath: '/images/artifacts/ptr-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ],
        'local-conflicts': [
            { name: 'АК-47', description: 'Автомат Калашникова', imagePath: '/images/artifacts/ak47-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'РПГ-7', description: 'Ручной противотанковый гранатомет', imagePath: '/images/artifacts/rpg-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Форма Афганистан', description: 'Полевая форма советских войск', imagePath: '/images/artifacts/afghan-uniform-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Ми-24', description: 'Ударный вертолет', imagePath: '/images/artifacts/mi24-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'СВД', description: 'Снайперская винтовка Драгунова', imagePath: '/images/artifacts/svd-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Бронетранспортер', description: 'БТР-80', imagePath: '/images/artifacts/btr-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ],
        'svo': [
            { name: 'Орлан-10', description: 'Многофункциональный БПЛА', imagePath: '/images/artifacts/orlan-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Ратник', description: 'Бронежилет экипировки "Ратник"', imagePath: '/images/artifacts/ratnik-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'АК-12', description: 'Автомат Калашникова АК-12', imagePath: '/images/artifacts/ak12-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Т-90М', description: 'Танк "Прорыв"', imagePath: '/images/artifacts/t90-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'Полевой госпиталь', description: 'Мобильный военный госпиталь', imagePath: '/images/artifacts/hospital-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { name: 'БПЛА "Ланцет"', description: 'Барражирующий боеприпас', imagePath: '/images/artifacts/lancet-placeholder.png', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ]
    };
    
    return allArtifacts[sectionId] || [];
}

module.exports = router;