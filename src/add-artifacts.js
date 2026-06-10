const mongoose = require('mongoose');
const Person = require('./models/Person');

// Новые артефакты для каждой персоналии
const artifactsToAdd = {
    'Иванов Иван Иванович': [
        {
            name: 'Писательский стол',
            description: 'Старинный письменный стол, за которым были созданы первые рассказы',
            year: 1975,
            material: 'Дуб, латунь',
            dimensions: '120x70x75 см'
        },
        {
            name: 'Настольная лампа',
            description: 'Лампа, освещавшая рабочие вечера писателя',
            year: 1978,
            material: 'Металл, стекло',
            dimensions: '40x25x25 см'
        },
        {
            name: 'Библиотека',
            description: 'Личная библиотека с автографами других писателей',
            year: 1980,
            material: 'Книги, дерево',
            dimensions: '200x100x30 см'
        }
    ],
    'Петрова Мария Сергеевна': [
        {
            name: 'Поэтический дневник',
            description: 'Личный дневник с черновиками стихов',
            year: 1985,
            material: 'Бумага, кожа',
            dimensions: '15x21 см'
        },
        {
            name: 'Серебряная ручка',
            description: 'Подарочная ручка, подаренная на юбилей',
            year: 1990,
            material: 'Серебро',
            dimensions: '14 см'
        },
        {
            name: 'Фотоколлекция',
            description: 'Фотографии с творческих встреч и выступлений',
            year: 1995,
            material: 'Фотобумага',
            dimensions: '10x15 см'
        }
    ],
    'Сидоров Александр Петрович': [
        {
            name: 'Походная сумка',
            description: 'Сумка, с которой писатель ходил в фольклорные экспедиции',
            year: 1970,
            material: 'Кожа',
            dimensions: '40x30x15 см'
        },
        {
            name: 'Диктофон',
            description: 'Старый кассетный диктофон для записи народных песен',
            year: 1985,
            material: 'Пластик, металл',
            dimensions: '15x10x3 см'
        },
        {
            name: 'Карта экспедиций',
            description: 'Карта с отмеченными местами фольклорных экспедиций',
            year: 1975,
            material: 'Бумага',
            dimensions: '60x80 см'
        }
    ],
    'Кузнецова Елена Владимировна': [
        {
            name: 'Детские рисунки',
            description: 'Рисунки детей к стихам поэтессы',
            year: 2000,
            material: 'Бумага, краски',
            dimensions: '21x30 см'
        },
        {
            name: 'Игрушка-подарок',
            description: 'Мягкая игрушка, подаренная читателями',
            year: 2005,
            material: 'Ткань',
            dimensions: '30 см'
        },
        {
            name: 'Сборник переводов',
            description: 'Редкое издание с переводами зарубежных поэтов',
            year: 2010,
            material: 'Бумага',
            dimensions: '17x24 см'
        }
    ]
};

async function addArtifacts() {
    try {
        await mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0/virtual_museum');
        console.log('✅ Подключено к MongoDB');
        
        for (const [fullName, newArtifacts] of Object.entries(artifactsToAdd)) {
            // Находим персоналию
            const person = await Person.findOne({ fullName });
            
            if (!person) {
                console.log(`❌ Персоналия не найдена: ${fullName}`);
                continue;
            }
            
            console.log(`\n📝 Обработка: ${fullName}`);
            console.log(`   Текущее количество артефактов: ${person.artifacts.length}`);
            
            // Добавляем новые артефакты (только если их ещё нет)
            let addedCount = 0;
            for (const newArtifact of newArtifacts) {
                // Проверяем, существует ли уже такой артефакт
                const exists = person.artifacts.some(a => a.name === newArtifact.name);
                if (!exists) {
                    person.artifacts.push(newArtifact);
                    addedCount++;
                }
            }
            
            if (addedCount > 0) {
                await person.save();
                console.log(`   ✅ Добавлено артефактов: ${addedCount}`);
                console.log(`   Общее количество: ${person.artifacts.length}`);
            } else {
                console.log(`   ℹ️ Новых артефактов не добавлено`);
            }
        }
        
        console.log('\n✅ Все артефакты успешно добавлены!');
        
        // Выводим статистику
        const allPersons = await Person.find({ hallId: 1 });
        console.log('\n📊 Итоговая статистика:');
        for (const person of allPersons) {
            console.log(`   ${person.fullName}: ${person.artifacts.length} артефактов`);
        }
        
        await mongoose.disconnect();
        console.log('\n✅ Готово!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

addArtifacts();