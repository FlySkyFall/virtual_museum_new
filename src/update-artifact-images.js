const mongoose = require('mongoose');
const Person = require('./models/Person');

// Массив доступных изображений для артефактов
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

async function updateArtifactImages() {
    try {
        await mongoose.connect('mongodb://localhost:27017/virtual_museum');
        console.log('✅ Подключено к MongoDB');
        
        // Находим всех персоналий
        const persons = await Person.find({ hallId: 1 });
        
        let totalArtifactsUpdated = 0;
        
        for (const person of persons) {
            console.log(`\n📝 Обработка: ${person.fullName}`);
            console.log(`   Артефактов до обновления: ${person.artifacts.length}`);
            
            let artifactsUpdated = 0;
            
            // Обновляем изображения для каждого артефакта
            for (let i = 0; i < person.artifacts.length; i++) {
                const oldImagePath = person.artifacts[i].imagePath;
                const newImagePath = getRandomArtifactImage();
                
                // Меняем изображение
                person.artifacts[i].imagePath = newImagePath;
                artifactsUpdated++;
                
                console.log(`   Артефакт ${i + 1}: "${person.artifacts[i].name}"`);
                console.log(`      Было: ${oldImagePath}`);
                console.log(`      Стало: ${newImagePath}`);
            }
            
            if (artifactsUpdated > 0) {
                await person.save();
                totalArtifactsUpdated += artifactsUpdated;
                console.log(`   ✅ Обновлено артефактов: ${artifactsUpdated}`);
            }
        }
        
        console.log(`\n✅ Всего обновлено артефактов: ${totalArtifactsUpdated}`);
        
        // Выводим итоговую статистику
        console.log('\n📊 Итоговая статистика:');
        const allPersons = await Person.find({ hallId: 1 });
        for (const person of allPersons) {
            console.log(`   ${person.fullName}: ${person.artifacts.length} артефактов`);
            for (let i = 0; i < person.artifacts.length; i++) {
                console.log(`      - ${person.artifacts[i].name}: ${person.artifacts[i].imagePath}`);
            }
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Готово!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

updateArtifactImages();