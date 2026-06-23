const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk';

/**
 * Создаёт папку на Яндекс.Диске, если она не существует
 */
async function createFolder(folderPath) {
  const token = process.env.YANDEX_DISK_TOKEN;
  try {
    await axios.put(`${YANDEX_DISK_API}/resources`, null, {
      headers: { Authorization: `OAuth ${token}` },
      params: {
        path: folderPath,
        overwrite: false
      }
    });
    console.log(`📁 Папка создана: ${folderPath}`);
  } catch (error) {
    // Если папка уже существует, код 409 - это нормально
    if (error.response && error.response.status === 409) {
      console.log(`📁 Папка уже существует: ${folderPath}`);
      return;
    }
    throw error;
  }
}

async function uploadAndPublish(fileBuffer, originalName, folder = 'others') {
  try {
    const token = process.env.YANDEX_DISK_TOKEN;
    if (!token) throw new Error('YANDEX_DISK_TOKEN не задан в .env');

    const baseFolder = process.env.YANDEX_DISK_FOLDER || 'app_uploads';
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const remotePath = `/${baseFolder}/${cleanFolder}/${Date.now()}-${path.basename(originalName)}`;

    console.log(`📤 Загрузка на Яндекс.Диск: ${remotePath}`);

    // Создаём корневую и вложенную папки
    await createFolder(`/${baseFolder}`);
    await createFolder(`/${baseFolder}/${cleanFolder}`);

    // 1. Получаем URL для загрузки
    const uploadUrlResponse = await axios.get(`${YANDEX_DISK_API}/resources/upload`, {
      headers: { Authorization: `OAuth ${token}` },
      params: {
        path: remotePath,
        overwrite: false
      }
    });

    const uploadUrl = uploadUrlResponse.data.href;
    console.log(`✅ Получен URL загрузки`);

    // 2. Загружаем файл
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: originalName });

    await axios.put(uploadUrl, formData, {
      headers: formData.getHeaders()
    });

    console.log(`✅ Файл загружен`);

    // 3. Публикуем файл
    const publishResponse = await axios.put(`${YANDEX_DISK_API}/resources/publish`, null, {
      headers: { Authorization: `OAuth ${token}` },
      params: { path: remotePath }
    });

    console.log(`✅ Файл опубликован`);

    // 4. Получаем публичную ссылку (страница)
    const publicUrl = publishResponse.data.href; // например, https://yadi.sk/i/...
    console.log(`📎 Публичная страница: ${publicUrl}`);

    // 5. Получаем прямую ссылку на файл через API публичных ресурсов
    // Это даёт ссылку, доступную без авторизации
    const publicResourcesResponse = await axios.get(`${YANDEX_DISK_API}/public/resources`, {
      params: {
        public_key: publicUrl
      }
    });

    const directLink = publicResourcesResponse.data.file;
    if (!directLink) {
      throw new Error('Не удалось получить прямую ссылку на файл');
    }

    console.log(`✅ Прямая ссылка для img: ${directLink}`);
    return directLink;
  } catch (error) {
    console.error('❌ Ошибка при загрузке на Яндекс.Диск:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Нет ответа от сервера');
    } else {
      console.error(error.message);
    }
    throw new Error(`не удалось загрузить файл на Яндекс.Диск: ${error.response?.data?.message || error.message}`);
  }
}

module.exports = { uploadAndPublish };