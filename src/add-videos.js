const mongoose = require('mongoose');
const Person = require('./models/Person');
require('dotenv').config();

// Видео ID для каждого артефакта (ID из Google Drive)
const videosToAdd = {
    'Иванов Иван Иванович': {
        'Печатная машинка': '1Ipf0gps6slrjnLAZmQPMTBpX3cPar7tQ',
        'Любимая ручка': '2Jqf1hpt7tmkjnMBZnQPNUCpX4dQbs8uR',
        'Рукописи': '3Krg2iqt8unljnOCZnRPNVDpX5eRct9vS',
        'Писательский стол': '4Lsh3jru9vonkpPDZoSOQWEpX6fSdu0wT',
        'Настольная лампа': '5Mti4ksv0wpnoqQEapTPRXFpX7gTev1xU',
        'Библиотека': '6Nuj5ltw1xqoprRFbqUQSYGpX8hUfw2yV'
    },
    'Петрова Мария Сергеевна': {
        'Поэтический блокнот': '7Ovk6mux2yrpqsSGcrVRTHpX9iVgx3zW',
        'Награды': '8Pwl7nvy3zsqrtrHdsWSUIpX0jWhya4X',
        'Поэтический дневник': '9Qxm8owz4atsutIetXTVJpX1kXizb5Y',
        'Серебряная ручка': '10Ryn9px5butvuJfuYUVKqX2lYjac6Z',
        'Фотоколлекция': '11Szo0qy6cvuwiKgvZVWLRpX3mZkbd7a'
    },
    'Сидоров Александр Петрович': {
        'Коллекция аудиозаписей': '12Tap1rz7dwvxjLhwaWXMSpX4nAlb8eB',
        'Походная сумка': '13Ubq2sa8exvykMixbXNTpX5oBmc9fC',
        'Диктофон': '14Vcr3tb9fywzlNjycYOUqX6pCnd0gD',
        'Карта экспедиций': '15Wds4uc0gzAmOkaDdZVpX7qDoe1hE'
    },
    'Кузнецова Елена Владимировна': {
        'Коллекция детских рисунков': '16Xet5vd1haBnpLbEeWUYpX8rEpg2iF',
        'Игрушка-подарок': '17Yfu6we2ibCoqMcFfXVZqX9sFqh3jG',
        'Сборник переводов': '18Zgv7xf3jcDprNdGgYWApX0tGri4kH'
    }
};

async function addVideos() {
    try {
        // Подключаемся к MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/virtual_museum');
        console.log('✅ Подключено к MongoDB');
        
        for (const [fullName, artifactsVideo] of Object.entries(videosToAdd)) {
            // Находим персоналию
            const person = await Person.findOne({ fullName });
            
            if (!person) {
                console.log(`❌ Персоналия не найдена: ${fullName}`);
                continue;
            }
            
            console.log(`\n📝 Обработка: ${fullName}`);
            console.log(`   Всего артефактов: ${person.artifacts.length}`);
            
            let updatedCount = 0;
            
            // Обновляем видео ID для каждого артефакта
            for (let i = 0; i < person.artifacts.length; i++) {
                const artifact = person.artifacts[i];
                const videoId = artifactsVideo[artifact.name];
                
                if (videoId) {
                    artifact.videoId = videoId;
                    artifact.videoUrl = `https://drive.google.com/file/d/${videoId}/preview`; // Сохраняем полный URL для совместимости
                    updatedCount++;
                    console.log(`   ✅ Добавлено видео для: ${artifact.name}`);
                    console.log(`      ID: ${videoId}`);
                } else {
                    console.log(`   ⚠️ Видео не найдено для: ${artifact.name}`);
                }
            }
            
            if (updatedCount > 0) {
                await person.save();
                console.log(`   📊 Обновлено артефактов: ${updatedCount}`);
            }
        }
        
        console.log('\n✅ Все видео успешно добавлены!');
        
        // Выводим итоговую статистику
        console.log('\n📊 Итоговая статистика:');
        const allPersons = await Person.find({ hallId: 1 });
        for (const person of allPersons) {
            const withVideo = person.artifacts.filter(a => a.videoId).length;
            console.log(`   ${person.fullName}: ${withVideo}/${person.artifacts.length} артефактов с видео`);
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Готово!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

addVideos();