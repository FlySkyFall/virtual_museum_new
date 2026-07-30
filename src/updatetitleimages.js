const mongoose = require('mongoose');
const Person = require('./models/Person');

// Подключение к MongoDB (без устаревших опций)
mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0')
    .then(() => {
        console.log('Подключено к MongoDB');
        updateTitleImages();
    })
    .catch(err => {
        console.error('Ошибка подключения к MongoDB:', err);
        process.exit(1);
    });

async function updateTitleImages() {
    try {
        // Находим всех персоналий
        const persons = await Person.find({});
        
        console.log(`Найдено ${persons.length} персоналий`);
        
        if (persons.length === 0) {
            console.log('Нет персоналий для обновления');
            process.exit(0);
        }
        
        let updatedCount = 0;
        
        for (const person of persons) {
            // Проверяем, есть ли уже custom изображение для плашки
            // Если поле отсутствует или равно стандартному значению
            if (!person.titleImagePath || person.titleImagePath === '/images/literary-hall/person-title.png') {
                // Генерируем новое изображение для плашки на основе существующего buttonImagePath
                const buttonImage = person.buttonImagePath || '/images/literary-hall/person-placeholder.png';
                const fileName = buttonImage.split('/').pop();
                const nameWithoutExt = fileName.split('.')[0];
                
                // Создаем путь к изображению для плашки
                // Например, если buttonImagePath = '/images/literary-hall/person1.png'
                // то titleImagePath будет '/images/literary-hall/person1-title.png'
                const titleImagePath = `/images/literary-hall/${nameWithoutExt}-title.png`;
                
                // Обновляем запись
                person.titleImagePath = titleImagePath;
                await person.save();
                updatedCount++;
                console.log(`✓ Обновлено: ${person.fullName}`);
                console.log(`  buttonImagePath: ${person.buttonImagePath}`);
                console.log(`  titleImagePath: ${titleImagePath}`);
                console.log('---');
            } else {
                console.log(`⏭ Пропущено: ${person.fullName} (уже есть titleImagePath: ${person.titleImagePath})`);
            }
        }
        
        console.log(`\n✅ Обновление завершено! Обновлено ${updatedCount} записей.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}