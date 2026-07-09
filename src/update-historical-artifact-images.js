const mongoose = require('mongoose');
const HistoricalArtifact = require('./models/HistoricalArtifact');
require('dotenv').config();

// Используем тот же массив изображений, что и для других артефактов
const ARTIFACT_IMAGES = [
    '/images/artifacts/artifact1.png',
    '/images/artifacts/artifact2.png',
    '/images/artifacts/artifact3.png',
    '/images/artifacts/artifact4.png',
    '/images/artifacts/artifact5.png'
];

// Функция для получения случайного изображения
function getRandomArtifactImage() {
    const randomIndex = Math.floor(Math.random() * ARTIFACT_IMAGES.length);
    return ARTIFACT_IMAGES[randomIndex];
}

async function updateHistoricalArtifactImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual_museum');
        console.log('✅ Подключено к MongoDB');
        
        // Находим все исторические артефакты
        const artifacts = await HistoricalArtifact.find({});
        
        console.log(`📦 Найдено артефактов: ${artifacts.length}`);
        
        let updatedCount = 0;
        
        for (const artifact of artifacts) {
            const oldImagePath = artifact.imagePath;
            const newImagePath = getRandomArtifactImage();
            
            // Обновляем изображение
            artifact.imagePath = newImagePath;
            await artifact.save();
            updatedCount++;
            
            console.log(`\n📝 Артефакт: "${artifact.name}"`);
            console.log(`   Было: ${oldImagePath}`);
            console.log(`   Стало: ${newImagePath}`);
        }
        
        console.log(`\n✅ Обновлено артефактов: ${updatedCount}`);
        
        // Выводим итоговую статистику
        console.log('\n📊 Итоговая статистика:');
        const allArtifacts = await HistoricalArtifact.find({});
        for (const artifact of allArtifacts) {
            console.log(`   - ${artifact.name}: ${artifact.imagePath}`);
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Готово!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

updateHistoricalArtifactImages();