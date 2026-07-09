const mongoose = require('mongoose');
const HistoricalArtifact = require('./models/HistoricalArtifact');
require('dotenv').config();

// Используем существующий массив изображений из общей папки
const ARTIFACT_IMAGES = [
    '/images/artifacts/artifact1.png',
    '/images/artifacts/artifact2.png',
    '/images/artifacts/artifact3.png',
    '/images/artifacts/artifact4.png',
    '/images/artifacts/artifact5.png'
];

// Функция для получения случайного изображения
function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * ARTIFACT_IMAGES.length);
    return ARTIFACT_IMAGES[randomIndex];
}

// Данные для артефактов
const artifactData = [
    {
        name: 'Горельеф с портретом Л. Добычина',
        videoUrl: 'https://rutube.ru/embed/1234567890' // Замените на реальную ссылку
    },
    {
        name: 'Археологическая находка',
        videoUrl: 'https://rutube.ru/embed/0987654321' // Замените на реальную ссылку
    }
];

async function seedHistoricalArtifacts() {
    try {
        // Подключение к БД
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual_museum');
        console.log('✅ Подключено к MongoDB');

        // Очищаем коллекцию (опционально)
        await HistoricalArtifact.deleteMany({});
        console.log('🗑️ Старые артефакты удалены');

        // Создаём артефакты со случайными изображениями из общей папки
        const artifacts = artifactData.map((data) => ({
            name: data.name,
            videoUrl: data.videoUrl,
            imagePath: getRandomImage() // Используем изображения из /images/artifacts/
        }));

        // Сохраняем в БД
        const result = await HistoricalArtifact.insertMany(artifacts);
        console.log(`✅ Добавлено ${result.length} артефактов:`);

        // Выводим информацию о созданных артефактах
        result.forEach((artifact, index) => {
            console.log(`\n📦 Артефакт ${index + 1}:`);
            console.log(`   Название: ${artifact.name}`);
            console.log(`   Изображение: ${artifact.imagePath}`);
            console.log(`   Видео: ${artifact.videoUrl}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Готово!');

    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

// Запускаем скрипт
seedHistoricalArtifacts();