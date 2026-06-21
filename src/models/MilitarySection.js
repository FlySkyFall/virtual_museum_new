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

// Схема для артефактов (военное снаряжение)
const militaryArtifactSchema = new mongoose.Schema({
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
    country: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['weapon', 'equipment', 'document', 'uniform', 'award', 'other'],
        default: 'weapon'
    }
});

// Основная схема для военного раздела
const militarySectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: null
    },
    buttonImagePath: {
        type: String,
        default: '/images/war-hall/section-placeholder.png'
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        required: true
    },
    artifacts: [militaryArtifactSchema],
    hallId: {
        type: Number,
        required: true,
        default: 2
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Поля для военного раздела
    startYear: {
        type: Number,
        default: null
    },
    endYear: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

const MilitarySection = mongoose.model('MilitarySection', militarySectionSchema);

module.exports = MilitarySection;