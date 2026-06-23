const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk';

/**
 * Загружает файл на Яндекс.Диск и возвращает публичную ссылку
 * @param {Buffer} fileBuffer - содержимое файла
 * @param {string} originalName - оригинальное имя файла
 * @param {string} folder - папка на Диске (например, 'persons', 'artifacts')
 * @returns {Promise<string>} - публичная ссылка на файл
 */
async function uploadAndPublish(fileBuffer, originalName, folder = 'others') {
  try {
    const token = process.env.YANDEX_DISK_TOKEN;
    if (!token) throw new Error('YANDEX_DISK_TOKEN не задан в .env');

    const baseFolder = process.env.YANDEX_DISK_FOLDER || 'app_uploads';
    const remotePath = `/${baseFolder}/${folder}/${Date.now()}-${path.basename(originalName)}`;

    // 1. Получаем URL для загрузки
    const uploadUrlResponse = await axios.get(`${YANDEX_DISK_API}/resources/upload`, {
      headers: { Authorization: `OAuth ${token}` },
      params: {
        path: remotePath,
        overwrite: false
      }
    });

    const uploadUrl = uploadUrlResponse.data.href;

    // 2. Загружаем файл
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: originalName });

    await axios.put(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    // 3. Делаем файл публичным
    const publishResponse = await axios.put(`${YANDEX_DISK_API}/resources/publish`, null, {
      headers: { Authorization: `OAuth ${token}` },
      params: { path: remotePath }
    });

    // 4. Получаем публичную ссылку
    const publicUrl = publishResponse.data.href; // это ссылка вида https://yadi.sk/i/...
    // Для получения прямой ссылки на файл (без страницы) нужно добавить ?force_download=true или использовать другой метод,
    // но проще сохранить ссылку на страницу файла, либо получить прямую через meta.
    // Лучше получить прямую ссылку на скачивание:
    const metaResponse = await axios.get(`${YANDEX_DISK_API}/resources`, {
      headers: { Authorization: `OAuth ${token}` },
      params: { path: remotePath }
    });
    const directLink = metaResponse.data.file; // это прямая ссылка на файл

    return directLink;
  } catch (error) {
    console.error('Ошибка при загрузке на Яндекс.Диск:', error.response?.data || error.message);
    throw new Error('Не удалось загрузить файл на Яндекс.Диск');
  }
}

module.exports = { uploadAndPublish };