const mongoose = require('mongoose');

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

// Схема для артефактов (личных вещей)
const artifactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imagePath: {
        type: String,
        default: function() {
            return getRandomArtifactImage();
        }
    },
    videoUrl: {
        type: String,
        default: null
    },
    VideoId: {
        type: String,
        default: null
    },
    year: {
        type: Number,
        default: null
    },
    material: {
        type: String,
        default: null
    },
    dimensions: {
        type: String,
        default: null
    }
});

// Основная схема для персоналии
const personSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        unique: true
    },
    lastName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    patronymic: {
        type: String,
        default: null
    },
    birthYear: {
        type: Number,
        required: true
    },
    deathYear: {
        type: Number,
        default: null
    },
    photoPath: {
        type: String,
        default: '/images/persons/placeholder.jpg'
    },
    buttonImagePath: {
        type: String,
        default: '/images/literary-hall/person-placeholder.png'
    },
    biography: {
        type: String,
        required: true
    },
    shortBio: {
        type: String,
        required: true
    },
    artifacts: [artifactSchema],
    hallId: {
        type: Number,
        required: true,
        default: 1
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Person = mongoose.model('Person', personSchema);

module.exports = Person;