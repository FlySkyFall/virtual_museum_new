const mongoose = require('mongoose');
const HistoricalArtifact = require('./models/HistoricalArtifact');
require('dotenv').config();

const ARTIFACT_IMAGES = [
    '/images/artifacts/artifact1.png',
    '/images/artifacts/artifact2.png',
    '/images/artifacts/artifact3.png',
    '/images/artifacts/artifact4.png',
    '/images/artifacts/artifact5.png'
];

function getRandomImage() {
    const randomIndex = Math.floor(Math.random() * ARTIFACT_IMAGES.length);
    return ARTIFACT_IMAGES[randomIndex];
}

async function fixPaths() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/virtual_museum');
        console.log('✅ Подключено к MongoDB');
        
        const artifacts = await HistoricalArtifact.find({});
        console.log(`📦 Найдено артефактов: ${artifacts.length}`);
        
        for (const artifact of artifacts) {
            // Проверяем и исправляем путь
            let path = artifact.imagePath;
            
            // Если путь начинается с 'uploads/' или не содержит '/images/', исправляем
            if (!path.startsWith('/images/artifacts/')) {
                const newPath = getRandomImage();
                console.log(`\n📝 Артефакт: "${artifact.name}"`);
                console.log(`   Было: ${path}`);
                console.log(`   Стало: ${newPath}`);
                artifact.imagePath = newPath;
                await artifact.save();
            } else {
                console.log(`\n✅ Артефакт "${artifact.name}" уже имеет правильный путь: ${path}`);
            }
        }
        
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

fixPaths();