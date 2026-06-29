const mongoose = require('mongoose');
const War = require('./models/War');

const militaryData = {
    wars: [
        {
            name: 'Великая Отечественная война',
            nameKey: 'wow',
            order: 1,
            isActive: true,
            buttonImagePath: '/images/military-hall/wow-button-bg.jpg',
            titleImagePath: '/images/military-hall/titles/wow-title.png', // Плашка для ВОВ
            artifacts: [
                {
                    name: 'Артефакт 1',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_1',
                    imagePath: '/images/military-hall/artifacts/wow/artifact1.jpg',
                    isActive: true,
                    order: 1
                },
                {
                    name: 'Артефакт 2',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_2',
                    imagePath: '/images/military-hall/artifacts/wow/artifact2.jpg',
                    isActive: true,
                    order: 2
                },
                {
                    name: 'Артефакт 3',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_3',
                    imagePath: '/images/military-hall/artifacts/wow/artifact3.jpg',
                    isActive: true,
                    order: 3
                },
                {
                    name: 'Артефакт 4',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_4',
                    imagePath: '/images/military-hall/artifacts/wow/artifact4.jpg',
                    isActive: true,
                    order: 4
                },
                {
                    name: 'Артефакт 5',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_5',
                    imagePath: '/images/military-hall/artifacts/wow/artifact5.jpg',
                    isActive: true,
                    order: 5
                },
                {
                    name: 'Артефакт 6',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_6',
                    imagePath: '/images/military-hall/artifacts/wow/artifact6.jpg',
                    isActive: true,
                    order: 6
                },
                {
                    name: 'Артефакт 7',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_7',
                    imagePath: '/images/military-hall/artifacts/wow/artifact7.jpg',
                    isActive: true,
                    order: 7
                },
                {
                    name: 'Артефакт 8',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_8',
                    imagePath: '/images/military-hall/artifacts/wow/artifact8.jpg',
                    isActive: true,
                    order: 8
                },
                {
                    name: 'Артефакт 9',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_9',
                    imagePath: '/images/military-hall/artifacts/wow/artifact9.jpg',
                    isActive: true,
                    order: 9
                },
                {
                    name: 'Артефакт 10',
                    description: '',
                    rutubeVideoId: 'VIDEO_ID_10',
                    imagePath: '/images/military-hall/artifacts/wow/artifact10.jpg',
                    isActive: true,
                    order: 10
                }
            ]
        },
        {
            name: 'Локальные конфликты',
            nameKey: 'local',
            order: 2,
            isActive: true,
            buttonImagePath: '/images/military-hall/local-button-bg.jpg',
            titleImagePath: '/images/military-hall/titles/local-title.png', // Плашка для локальных конфликтов
            artifacts: [
                // Здесь будут артефакты локальных конфликтов
            ]
        },
        {
            name: 'СВО',
            nameKey: 'svo',
            order: 3,
            isActive: true,
            buttonImagePath: '/images/military-hall/svo-button-bg.jpg',
            titleImagePath: '/images/military-hall/titles/svo-title.png', // Плашка для СВО
            artifacts: [
                // Здесь будут артефакты СВО
            ]
        }
    ]
};

async function seedMilitaryHall() {
    try {
        await mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0/virtual_museum');
        console.log('✅ Подключено к MongoDB');

        await War.deleteMany({});
        console.log('🗑️  Старые данные удалены');

        const result = await War.insertMany(militaryData.wars);
        console.log(`✅ Добавлено ${result.length} войн:`);
        
        result.forEach((war, index) => {
            console.log(`\n📌 ${index + 1}. ${war.name}`);
            console.log(`   Артефактов: ${war.artifacts.length}`);
        });

        console.log('\n🎉 База данных военно-исторического зала успешно заполнена!');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

seedMilitaryHall();