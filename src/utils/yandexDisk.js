const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const YANDEX_DISK_API = 'https://cloud-api.yandex.net/v1/disk';

async function uploadAndPublish(fileBuffer, originalName, folder = 'others') {
  try {
    const token = process.env.YANDEX_DISK_TOKEN;
    if (!token) throw new Error('YANDEX_DISK_TOKEN не задан в .env');

    const baseFolder = process.env.YANDEX_DISK_FOLDER || 'app_uploads';
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const fileName = `${Date.now()}-${path.basename(originalName)}`;
    const remotePath = `/${baseFolder}/${cleanFolder}/${fileName}`;

    console.log(`📤 Загрузка на Яндекс.Диск: ${remotePath}`);

    // 1. Получаем URL для загрузки (создаём папки через параметр)
    const uploadUrlResponse = await axios.get(`${YANDEX_DISK_API}/resources/upload`, {
      headers: { Authorization: `OAuth ${token}` },
      params: {
        path: remotePath,
        overwrite: false,
        fields: 'href' // явно запрашиваем только href
      }
    });

    const uploadUrl = uploadUrlResponse.data.href;
    console.log(`✅ Получен URL загрузки`);

    // 2. Загружаем файл
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: originalName });

    await axios.put(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Length': fileBuffer.length
      }
    });

    console.log(`✅ Файл загружен`);

    // 3. Получаем информацию о файле (чтобы проверить, что он существует)
    const metaResponse = await axios.get(`${YANDEX_DISK_API}/resources`, {
      headers: { Authorization: `OAuth ${token}` },
      params: {
        path: remotePath,
        fields: 'public_key,file,public_url'
      }
    });

    console.log(`✅ Информация о файле получена`);

    // 4. Проверяем, опубликован ли уже файл
    let publicKey = metaResponse.data.public_key;
    let publicUrl = metaResponse.data.public_url;

    if (!publicKey) {
      console.log(`📢 Файл не опубликован, публикуем...`);
      
      // Публикуем файл
      const publishResponse = await axios.put(`${YANDEX_DISK_API}/resources/publish`, null, {
        headers: { Authorization: `OAuth ${token}` },
        params: { path: remotePath }
      });

      publicKey = publishResponse.data.public_key;
      publicUrl = publishResponse.data.public_url;
      
      console.log(`✅ Файл опубликован`);
    } else {
      console.log(`✅ Файл уже опубликован`);
    }

    // 5. Если есть public_key, получаем прямую ссылку
    let directLink = metaResponse.data.file;

    if (!directLink && publicKey) {
      console.log(`🔑 Получаем прямую ссылку по public_key...`);
      
      // Получаем прямую ссылку через API публичных ресурсов
      const publicResourcesResponse = await axios.get(`${YANDEX_DISK_API}/public/resources`, {
        params: {
          public_key: publicKey
        }
      });

      directLink = publicResourcesResponse.data.file;
      console.log(`✅ Прямая ссылка получена через public resources API`);
    }

    // 6. Если всё ещё нет прямой ссылки, пробуем получить через meta с полем file
    if (!directLink) {
      console.log(`🔄 Получаем прямую ссылку через meta...`);
      const finalMeta = await axios.get(`${YANDEX_DISK_API}/resources`, {
        headers: { Authorization: `OAuth ${token}` },
        params: {
          path: remotePath,
          fields: 'file'
        }
      });
      directLink = finalMeta.data.file;
    }

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