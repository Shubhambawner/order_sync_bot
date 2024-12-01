const fs = require('fs');
const path = require('path');
const axios = require('axios');


const token = process.env.telegram_token; //info: telegram Bot token, named as order_sync_bot


module.exports = async function downloadImage(fileRemotePath, fileLocalPath) {
    
    // Check if the './photos' directory exists, if not, create it
    const photosDir = path.join(__dirname, 'photos');
    if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
    }
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileRemotePath}`;

    // Download the image
    const writer = fs.createWriteStream(fileLocalPath);
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream',
    });

    // Save the image to local file system
    response.data.pipe(writer);

    // Wait for the image to be fully written to disk
    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}