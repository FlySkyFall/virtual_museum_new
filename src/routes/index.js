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

// ============================================
// API ПОИСКА ПО ВСЕМУ САЙТУ
// ============================================
router.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
        
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const results = [];

        // ===== 1. ПОИСК ПО ЗАЛАМ (главная страница) =====
        halls.forEach(hall => {
            const searchText = (hall.name + ' ' + hall.description).toLowerCase();
            if (searchText.includes(query)) {
                results.push({
                    title: hall.name,
                    description: hall.description,
                    url: hall.route,
                    type: 'Зал',
                    relevance: hall.name.toLowerCase().includes(query) ? 10 : 5
                });
            }
        });

        // ===== 2. ПОИСК ПО ПЕРСОНАЛИЯМ =====
        const persons = await Person.find({ isActive: true });
        persons.forEach(person => {
            const searchText = (
                person.fullName + ' ' + 
                person.lastName + ' ' + 
                person.firstName + ' ' + 
                (person.patronymic || '') + ' ' +
                person.biography + ' ' +
                person.shortBio
            ).toLowerCase();
            
            if (searchText.includes(query)) {
                // Проверяем релевантность по имени
                const nameMatch = person.fullName.toLowerCase().includes(query);
                results.push({
                    title: person.fullName,
                    description: person.shortBio || person.biography.substring(0, 150) + '...',
                    url: `/hall/literary-local-history/person/${person._id}`,
                    type: 'Персоналия',
                    relevance: nameMatch ? 10 : 7
                });
            }

            // ===== 3. ПОИСК ПО АРТЕФАКТАМ ПЕРСОНАЛИЙ =====
            if (person.artifacts && person.artifacts.length > 0) {
                person.artifacts.forEach(artifact => {
                    const artifactSearchText = (artifact.name + ' ' + artifact.description).toLowerCase();
                    if (artifactSearchText.includes(query)) {
                        results.push({
                            title: artifact.name,
                            description: artifact.description || `Артефакт из коллекции ${person.fullName}`,
                            url: `/hall/literary-local-history/person/${person._id}?artifact=${artifact._id}`,
                            type: 'Артефакт',
                            relevance: artifact.name.toLowerCase().includes(query) ? 9 : 6
                        });
                    }
                });
            }
        });

        // ===== 4. ПОИСК ПО ВОЕННЫМ КОНФЛИКТАМ =====
        const wars = await War.find({ isActive: true });
        wars.forEach(war => {
            const searchText = (war.name + ' ' + war.nameKey).toLowerCase();
            if (searchText.includes(query)) {
                results.push({
                    title: war.name,
                    description: `Военно-исторический раздел: ${war.name}`,
                    url: `/hall/military-history/war/${war.nameKey}`,
                    type: 'Военный конфликт',
                    relevance: war.name.toLowerCase().includes(query) ? 10 : 7
                });
            }

            // ===== 5. ПОИСК ПО АРТЕФАКТАМ ВОЙН =====
            if (war.artifacts && war.artifacts.length > 0) {
                war.artifacts.forEach(artifact => {
                    const artifactSearchText = (artifact.name + ' ' + artifact.description).toLowerCase();
                    if (artifactSearchText.includes(query)) {
                        results.push({
                            title: artifact.name,
                            description: artifact.description || `Артефакт из раздела ${war.name}`,
                            url: `/hall/military-history/war/${war.nameKey}?artifact=${artifact._id}`,
                            type: 'Военный артефакт',
                            relevance: artifact.name.toLowerCase().includes(query) ? 9 : 6
                        });
                    }
                });
            }
        });

        // ===== 6. ПОИСК ПО ИСТОРИЧЕСКИМ АРТЕФАКТАМ =====
        const historicalArtifacts = await HistoricalArtifact.find();
        historicalArtifacts.forEach(artifact => {
            const searchText = artifact.name.toLowerCase();
            if (searchText.includes(query)) {
                results.push({
                    title: artifact.name,
                    description: 'Исторический артефакт',
                    url: `/hall/historical-artifacts?artifact=${artifact._id}`,
                    type: 'Исторический артефакт',
                    relevance: artifact.name.toLowerCase().includes(query) ? 9 : 6
                });
            }
        });

        // ===== 7. ПОИСК ПО АВТОГРАФАМ (если есть модель) =====
        // Если у вас есть модель Autograf, добавьте поиск по ней
        // const autografs = await Autograf.find();
        // autografs.forEach(autograf => {
        //     const searchText = (autograf.name + ' ' + autograf.description).toLowerCase();
        //     if (searchText.includes(query)) {
        //         results.push({
        //             title: autograf.name,
        //             description: autograf.description || 'Автограф',
        //             url: `/hall/autograf-artifacts/${autograf._id}`,
        //             type: 'Автограф',
        //             relevance: autograf.name.toLowerCase().includes(query) ? 9 : 6
        //         });
        //     }
        // });

        // ===== СОРТИРОВКА РЕЗУЛЬТАТОВ =====
        // Сортируем по релевантности (чем выше число, тем выше в списке)
        results.sort((a, b) => b.relevance - a.relevance);

        // Ограничиваем количество результатов (максимум 20)
        const limitedResults = results.slice(0, 20);

        // Формируем ответ с группировкой по типам
        const groupedResults = {
            total: limitedResults.length,
            items: limitedResults
        };

        res.json(groupedResults);

    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.status(500).json({ error: 'Ошибка при выполнении поиска' });
    }
});

module.exports = router;