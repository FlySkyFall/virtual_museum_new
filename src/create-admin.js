const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

async function createAdmin() {
    try {
        await mongoose.connect('mongodb+srv://museum_admin:danchik2282271@cluster0.bsclqmy.mongodb.net/?appName=Cluster0/virtual_museum');
        
        // Хешируем пароль вручную
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = new Admin({
            username: 'admin',
            password: hashedPassword
        });
        
        await admin.save();
        console.log('✅ Администратор создан!');
        console.log('Username: admin');
        console.log('Password: admin123');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

createAdmin();