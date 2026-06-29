const mongoose = require('mongoose');

const warSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Великая Отечественная война', 'Локальные конфликты', 'СВО']
    },
    nameKey: {
        type: String,
        required: true,
        enum: ['wow', 'local', 'svo'],
        unique: true
    },
    order: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    isActive: {
        type: Boolean,
        default: true
    },
    buttonImagePath: {
        type: String,
        required: true
    },
    titleImagePath: {
        type: String,
        required: true // Путь к плашке с названием войны
    },
    artifacts: [{
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ''
        },
        rutubeVideoId: {
            type: String,
            required: true
        },
        imagePath: {
            type: String,
            required: true // Путь к изображению артефакта
        },
        isActive: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('War', warSchema);