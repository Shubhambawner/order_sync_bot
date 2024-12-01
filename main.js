const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const extractOrderInfo = require('./module.gemini')


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config(); // Load .env only in development
}
const token = process.env.telegram_token; //info: telegram Bot token, named as order_sync_bot
const deployment_id = process.env.appscript_deployment_id
const gapi_url = `https://script.google.com/macros/s/${deployment_id}/exec`
var debug = false
const chatIdMap = {
    '6867886957': 'LQT791'
}

const bot = new TelegramBot(token, { polling: true });

//-----------------------------------------------------------------
// Path to the local JSON database file
const dbPath = path.join(__dirname, 'isinData.json');

// Function to load the local symbol-ISIN map from the JSON file
async function loadLocalDb() {
    try {
        const data = await new Promise((resolve, reject) => {
            fs.readFile(dbPath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err)
                }
                resolve(data)
            });
        })
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading local DB:", error.message);
        return {}; // Return an empty object if file doesn't exist or fails to load
    }
}
var localDb;
// Function to populate ISINs for stock orders using only local DB
async function populateISINs(stockOrders) {
    // Load the local symbol-ISIN map from the JSON file
    if (!localDb) {
        localDb = await loadLocalDb();
        console.log('local db loaded')
    }

    // Map each stock order to its ISIN from the local DB
    const updatedOrders = stockOrders.map((stockOrder) => {
        const { tradingsymbol } = stockOrder;

        // Check if the ISIN exists in the local DB
        if (localDb[tradingsymbol]) {
            stockOrder.isin = localDb[tradingsymbol][0]; // Use the ISIN from the local DB
        } else {
            console.error(`ISIN not found for tradingsymbol: ${tradingsymbol}`);
            // stockOrder.isin = 'ISIN not found'; // Mark as not found
        }

        return stockOrder; // Return updated stock order
    });

    return updatedOrders;
}
//------------------------------------------------------------------------
function quantityCorrection(incomingInfo) {
    incomingInfo.map(x => {
        // todo add logic: if string has '/' then only do this.
        if (x.total_quantity) {
            
        }
        x.total_quantity = Number(x.total_quantity.substr(0, Math.floor(x.total_quantity.length / 2)));
        return x
    })
    return incomingInfo
}

async function getOrders(text, chatId) {
    incomingInfo = await extractOrderInfo(text)
    incomingInfoISIN = await populateISINs(incomingInfo)
    // orderData = quantityCorrection(incomingInfoISIN)
    orderData = incomingInfoISIN
    orderData.forEach(order => {
        order.date = Date.now()
        order.client_id = chatIdMap[chatId]
    });
    return incomingInfo
}
// Listener for receiving images
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id; // Get the highest resolution image


    console.log(chatId, 'chatId');
    if (!chatIdMap[chatId]) {
        await bot.sendMessage(chatId, 'No autherisation to use!' + error.message);
        return;
    }
    try {
        // Get file URL from Telegram API
        const fileInfo = await bot.getFile(fileId);
        if (debug) console.log(fileInfo);

        // Check if the './photos' directory exists, if not, create it
        const photosDir = path.join(__dirname, 'photos');
        if (!fs.existsSync(photosDir)) {
            fs.mkdirSync(photosDir, { recursive: true });
        }
        const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;

        // Download the image
        const filePath = path.join(__dirname, fileInfo.file_path);
        const writer = fs.createWriteStream(filePath);
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

        if (debug) console.log('Image downloaded successfully.');
        if (debug) await bot.sendMessage(chatId, 'Image downloaded successfully.');


        // Perform OCR on the downloaded image using async/await
        const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
        if (debug) console.log('Extracted text:', text);
        if (debug) await bot.sendMessage(chatId, text);

        // clear file at filePath
        fs.unlinkSync(filePath)

        // Convert the extracted text to JSON
        const jsonData = await getOrders(text, chatId);
        if (debug) await bot.sendMessage(chatId, JSON.stringify(jsonData));
        if (debug) console.log(jsonData);

        // Send the payload to Google App Script API

        const api_response = await axios.post(gapi_url + `?action=update`, jsonData);

        // Handle successful response from Google App Script
        if (api_response.data.status === 'success') {
            if (debug) console.log(api_response);
            if (debug) await bot.sendMessage(chatId, JSON.stringify(api_response.data));

            bot.sendMessage(chatId, 'Order added successfully!');
        } else {
            bot.sendMessage(chatId, 'Failed to add order: ' + api_response.data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        if (debug) await bot.sendMessage(chatId, JSON.stringify(api_response.data));

        await bot.sendMessage(chatId, 'An error occurred: ' + error.message);
    }
});

console.log('Bot is running and using polling for updates...');


// Fallback listener for unrecognized commands
bot.on('message', async (message) => {
    const chatId = message.chat.id;
    if (!chatIdMap[chatId]) {
        await bot.sendMessage(chatId, 'No autherisation to use!' + error.message);
        return;
    }
    console.log(message);

    if (message.text == 'debug') {
        debug = true
        await bot.sendMessage(chatId, 'debug mode ON');

    }
    if (message.text == 'debugend') {
        debug = false
        await bot.sendMessage(chatId, 'debug mode OFF');
    }
    // bot.sendMessage(chatId, 'Send /addorder with order details to add an order.');
});

