const mongoose = require('mongoose');
const Person = require('./models/Person');

// Данные для загрузки в базу
const personsData = [
    {
        fullName: 'Иванов Иван Иванович',
        lastName: 'Иванов',
        firstName: 'Иван',
        patronymic: 'Иванович',
        birthYear: 1950,
        deathYear: null,
        photoPath: '/images/persons/ivanov.jpg',
        buttonImagePath: '/images/literary-hall/person1.png',
        shortBio: 'Известный детский писатель, автор более 50 книг о природе родного края',
        biography: `<p>Иванов Иван Иванович родился в 1950 году в городе N. С детства любил природу и много времени проводил в лесах и полях родного края.</p>
                    <p>Окончил литературный институт, после чего начал писать рассказы для детей. Первая книга "Лесные тайны" вышла в 1975 году и сразу полюбилась юным читателям.</p>
                    <p>За свою карьеру написал более 50 книг, многие из которых стали классикой детской литературы. Особую известность получили книги о природе и животных.</p>
                    <p>Лауреат множества литературных премий. Член Союза писателей России.</p>
                    <p>В 2010 году открыл детскую литературную студию, где помогает юным талантам развивать свои способности.</p>`,
        artifacts: [
            {
                name: 'Печатная машинка',
                description: 'Старая печатная машинка "Москва", на которой писатель создавал свои первые рассказы',
                imagePath: '/images/artifacts/ivanov/typewriter.jpg',
                year: 1970,
                material: 'Металл, пластик',
                dimensions: '40x30x15 см'
            },
            {
                name: 'Любимая ручка',
                description: 'Перьевая ручка, подаренная женой в день рождения',
                imagePath: '/images/artifacts/ivanov/pen.jpg',
                year: 1985,
                material: 'Золото, пластик',
                dimensions: '14 см'
            },
            {
                name: 'Рукописи',
                description: 'Оригинальные рукописи первых рассказов с правками автора',
                imagePath: '/images/artifacts/ivanov/manuscripts.jpg',
                year: 1972,
                material: 'Бумага',
                dimensions: '21x30 см'
            }
        ],
        hallId: 1,
        order: 1,
        isActive: true
    },
    {
        fullName: 'Петрова Мария Сергеевна',
        lastName: 'Петрова',
        firstName: 'Мария',
        patronymic: 'Сергеевна',
        birthYear: 1965,
        deathYear: null,
        photoPath: '/images/persons/petrova.jpg',
        buttonImagePath: '/images/literary-hall/person2.png',
        shortBio: 'Поэтесса, лауреат множества литературных премий',
        biography: `<p>Петрова Мария Сергеевна родилась в 1965 году в творческой семье. Первые стихи начала писать в 7 лет.</p>
                    <p>Окончила филологический факультет университета. Первый сборник стихов "Утренняя роса" вышел в 1990 году.</p>
                    <p>Автор 15 поэтических сборников. Её стихи переведены на многие языки мира.</p>
                    <p>Много путешествует и проводит творческие встречи с читателями.</p>`,
        artifacts: [
            {
                name: 'Поэтический блокнот',
                description: 'Первый блокнот со стихами, написанными в детстве',
                imagePath: '/images/artifacts/petrova/notebook.jpg',
                year: 1972,
                material: 'Бумага, кожа',
                dimensions: '15x20 см'
            },
            {
                name: 'Награды',
                description: 'Литературные премии и награды поэтессы',
                imagePath: '/images/artifacts/petrova/awards.jpg'
            }
        ],
        hallId: 1,
        order: 2,
        isActive: true
    },
    {
        fullName: 'Сидоров Александр Петрович',
        lastName: 'Сидоров',
        firstName: 'Александр',
        patronymic: 'Петрович',
        birthYear: 1945,
        deathYear: 2018,
        photoPath: '/images/persons/sidorov.jpg',
        buttonImagePath: '/images/literary-hall/person3.png',
        shortBio: 'Прозаик, историк, исследователь местного фольклора',
        biography: `<p>Сидоров Александр Петрович (1945-2018) - известный писатель и историк.</p>
                    <p>Посвятил свою жизнь изучению фольклора и истории родного края.</p>
                    <p>Автор многотомного исследования "Сказки и легенды нашего края".</p>
                    <p>За свою жизнь собрал уникальную коллекцию народных сказаний и преданий.</p>`,
        artifacts: [
            {
                name: 'Коллекция аудиозаписей',
                description: 'Уникальные аудиозаписи народных сказителей, собранные в экспедициях',
                imagePath: '/images/artifacts/sidorov/recordings.jpg',
                videoUrl: '/videos/sidorov/expedition.mp4',
                year: 1980
            }
        ],
        hallId: 1,
        order: 3,
        isActive: true
    },
    {
        fullName: 'Кузнецова Елена Владимировна',
        lastName: 'Кузнецова',
        firstName: 'Елена',
        patronymic: 'Владимировна',
        birthYear: 1972,
        deathYear: null,
        photoPath: '/images/persons/kuznetsova.jpg',
        buttonImagePath: '/images/literary-hall/person4.png',
        shortBio: 'Детская поэтесса, переводчик, автор популярных стихов для малышей',
        biography: `<p>Кузнецова Елена Владимировна - современная детская поэтесса и переводчик.</p>
                    <p>Родилась в 1972 году. Стихи начала писать в раннем детстве.</p>
                    <p>Известна своими весёлыми и поучительными стихами для самых маленьких читателей.</p>
                    <p>Перевела на русский язык множество зарубежных детских стихов и сказок.</p>`,
        artifacts: [
            {
                name: 'Коллекция детских рисунков',
                description: 'Рисунки детей к стихам поэтессы, присланные на конкурсы',
                imagePath: '/images/artifacts/kuznetsova/drawings.jpg'
            }
        ],
        hallId: 1,
        order: 4,
        isActive: true
    }
];

// Функция для загрузки данных
async function seedDatabase() {
    try {
        // Подключаемся к MongoDB (без устаревших опций)
        await mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0/virtual_museum');
        
        console.log('✅ Подключено к MongoDB');
        
        // Очищаем коллекцию persons (удаляем все старые записи)
        await Person.deleteMany({});
        console.log('🗑️ Старые данные удалены');
        
        // Загружаем новые данные
        const inserted = await Person.insertMany(personsData);
        console.log(`✅ Загружено ${inserted.length} персоналий`);
        
        // Выводим список загруженных записей
        console.log('\n📚 Загруженные персоналии:');
        inserted.forEach(person => {
            console.log(`   - ${person.fullName} (ID: ${person._id})`);
        });
        
        // Закрываем соединение
        await mongoose.disconnect();
        console.log('\n✅ Готово! Соединение закрыто');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

// Запускаем загрузку
seedDatabase();