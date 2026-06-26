const mongoose = require('mongoose');
const War = require('./models/War');

// Данные для военно-исторического зала
const militaryData = {
    wars: [
        {
            name: 'Великая Отечественная война',
            nameKey: 'wow',
            order: 1,
            isActive: true,
            buttonImagePath: '/images/military-hall/wow-button-bg.png',
            artifacts: [
                {
                    name: 'Солдатский медальон',
                    description: 'Личный медальон солдата Великой Отечественной войны. В таких медальонах хранили записки с именем и адресом бойца.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 1
                },
                {
                    name: 'Фронтовая фляжка',
                    description: 'Алюминиевая фляжка красноармейца образца 1941 года. Незаменимый атрибут солдата на фронте.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 2
                },
                {
                    name: 'Письмо с фронта',
                    description: 'Письмо-треугольник солдата родным. Такие письма складывали особым образом без конвертов.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 3
                },
                {
                    name: 'Орден Красной Звезды',
                    description: 'Боевая награда Великой Отечественной войны. Орденом награждали за мужество и отвагу.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 4
                },
                {
                    name: 'Котелок солдатский',
                    description: 'Походный котелок красноармейца. В нем варили кашу и кипятили воду.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 5
                }
            ]
        },
        {
            name: 'Локальные конфликты',
            nameKey: 'local',
            order: 2,
            isActive: true,
            buttonImagePath: '/images/military-hall/local-button-bg.png',
            artifacts: [
                {
                    name: 'Артефакт конфликта 1',
                    description: 'Описание артефакта времен локальных конфликтов. Здесь будет представлен уникальный экспонат.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 1
                },
                {
                    name: 'Артефакт конфликта 2',
                    description: 'Еще один важный артефакт, рассказывающий о локальных конфликтах.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 2
                },
                {
                    name: 'Артефакт конфликта 3',
                    description: 'Третий экспонат, демонстрирующий быт и технику того времени.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 3
                }
            ]
        },
        {
            name: 'СВО',
            nameKey: 'svo',
            order: 3,
            isActive: true,
            buttonImagePath: '/images/military-hall/svo-button-bg.png',
            artifacts: [
                {
                    name: 'Артефакт СВО 1',
                    description: 'Современный артефакт специальной военной операции, показывающий реалии сегодняшнего дня.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 1
                },
                {
                    name: 'Артефакт СВО 2',
                    description: 'Еще один важный экспонат, отражающий современные военные конфликты.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 2
                },
                {
                    name: 'Артефакт СВО 3',
                    description: 'Третий артефакт, показывающий различные аспекты СВО.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 3
                },
                {
                    name: 'Артефакт СВО 4',
                    description: 'Четвертый экспонат, рассказывающий о современной военной технике.',
                    rutubeVideoId: 'dQw4w9WgXcQ', // Замените на реальный ID видео с Rutube
                    isActive: true,
                    order: 4
                }
            ]
        }
    ]
};

// Функция для заполнения БД
async function seedMilitaryHall() {
    try {
        // Подключаемся к MongoDB
        await mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0/virtual_museum');

        console.log('✅ Подключено к MongoDB');

        // Очищаем коллекцию War
        await War.deleteMany({});
        console.log('🗑️  Старые данные удалены');

        // Вставляем новые данные
        const result = await War.insertMany(militaryData.wars);
        console.log(`✅ Добавлено ${result.length} войн:`);
        
        // Выводим информацию о добавленных данных
        result.forEach((war, index) => {
            console.log(`\n📌 ${index + 1}. ${war.name}`);
            console.log(`   - Артефактов: ${war.artifacts.length}`);
            console.log(`   - ID: ${war._id}`);
            war.artifacts.forEach((artifact, i) => {
                console.log(`     ${i + 1}. ${artifact.name}`);
            });
        });

        console.log('\n🎉 База данных военно-исторического зала успешно заполнена!');
        
        // Закрываем соединение
        await mongoose.connection.close();
        console.log('🔌 Соединение с БД закрыто');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при заполнении БД:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Запускаем скрипт
seedMilitaryHall();