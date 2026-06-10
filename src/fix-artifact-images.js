const mongoose = require('mongoose');
require('dotenv').config();

// Только эти 5 изображений доступны
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

async function fixAllArtifactImages() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        
        const Person = require('./models/Person');
        
        // Находим всех персоналий
        const persons = await Person.find({});
        
        let totalArtifacts = 0;
        let totalUpdated = 0;
        
        for (const person of persons) {
            console.log(`\n📝 Обработка: ${person.fullName}`);
            console.log(`   Артефактов: ${person.artifacts.length}`);
            
            for (let i = 0; i < person.artifacts.length; i++) {
                totalArtifacts++;
                const artifact = person.artifacts[i];
                const oldPath = artifact.imagePath;
                
                // Присваиваем случайное изображение из 5 доступных
                const newPath = getRandomArtifactImage();
                person.artifacts[i].imagePath = newPath;
                totalUpdated++;
                
                console.log(`   ${i + 1}. ${artifact.name}`);
                console.log(`      Было: ${oldPath}`);
                console.log(`      Стало: ${newPath}`);
            }
            
            // Сохраняем изменения
            await person.save();
            console.log(`   ✅ Сохранено`);
        }
        
        console.log(`\n📊 ИТОГО:`);
        console.log(`   Обработано артефактов: ${totalArtifacts}`);
        console.log(`   Обновлено артефактов: ${totalUpdated}`);
        
        // Выводим итоговую проверку
        console.log(`\n🔍 Итоговая проверка:`);
        const allPersons = await Person.find({});
        for (const person of allPersons) {
            console.log(`\n${person.fullName}:`);
            for (let i = 0; i < person.artifacts.length; i++) {
                const artifact = person.artifacts[i];
                const isValid = ARTIFACT_IMAGES.includes(artifact.imagePath);
                console.log(`   ${i + 1}. ${artifact.name} → ${artifact.imagePath} ${isValid ? '✅' : '❌'}`);
            }
        }
        
        await mongoose.disconnect();
        console.log(`\n✅ Готово! Все изображения артефактов заменены на случайные из 5 доступных.`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

fixAllArtifactImages();