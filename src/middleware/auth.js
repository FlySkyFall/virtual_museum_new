const Admin = require('../models/Admin');

// Проверка, авторизован ли пользователь
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin/login');
};

// Проверка, является ли пользователь активным администратором
const isAdmin = async (req, res, next) => {
    try {
        if (!req.session.adminId) {
            return res.redirect('/admin/login');
        }
        
        const admin = await Admin.findById(req.session.adminId);
        if (!admin || !admin.isActive) {
            req.session.destroy();
            return res.redirect('/admin/login?error=account_disabled');
        }
        
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Ошибка проверки администратора:', error);
        res.status(500).send('Ошибка сервера');
    }
};

// Проверка, что пользователь НЕ авторизован (для страниц логина)
const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin');
    }
    next();
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isNotAuthenticated
};