// seed/military-hall.js - скрипт для заполнения БД

const War = require('../models/War');

async function initMilitaryHall() {
    try {
        // Очищаем существующие данные
        await War.deleteMany({});
        
        const wars = [
            {
                name: 'Великая Отечественная война',
                nameKey: 'wow',
                order: 1,
                buttonImagePath: '/images/military-hall/wow-button-bg.png',
                artifacts: [
                    {
                        name: 'Солдатский медальон',
                        description: 'Личный медальон солдата ВОВ',
                        videoPath: '/videos/wow/medallion.mp4',
                        thumbnailPath: '/images/military-hall/artifacts/medallion-thumb.jpg',
                        order: 1
                    },
                    {
                        name: 'Фронтовая фляжка',
                        description: 'Фляжка красноармейца',
                        videoPath: '/videos/wow/flask.mp4',
                        thumbnailPath: '/images/military-hall/artifacts/flask-thumb.jpg',
                        order: 2
                    },
                    // Добавьте другие артефакты ВОВ
                ]
            },
            {
                name: 'Локальные конфликты',
                nameKey: 'local',
                order: 2,
                buttonImagePath: '/images/military-hall/local-button-bg.png',
                artifacts: [
                    {
                        name: 'Артефакт локального конфликта 1',
                        description: 'Описание артефакта',
                        videoPath: '/videos/local/artifact1.mp4',
                        thumbnailPath: '/images/military-hall/artifacts/local1-thumb.jpg',
                        order: 1
                    },
                    // Добавьте другие артефакты локальных конфликтов
                ]
            },
            {
                name: 'СВО',
                nameKey: 'svo',
                order: 3,
                buttonImagePath: '/images/military-hall/svo-button-bg.png',
                artifacts: [
                    {
                        name: 'Артефакт СВО 1',
                        description: 'Описание артефакта СВО',
                        videoPath: '/videos/svo/artifact1.mp4',
                        thumbnailPath: '/images/military-hall/artifacts/svo1-thumb.jpg',
                        order: 1
                    },
                    // Добавьте другие артефакты СВО
                ]
            }
        ];
        
        await War.insertMany(wars);
        console.log('Военно-исторический зал инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

module.exports = initMilitaryHall;