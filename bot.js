const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const Tesseract = require('tesseract.js');
const extractOrderInfo = require('./module.gemini')
const populateISINs = require('./module.isins');
const downloadImage = require('./module.downloadImage');



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


//------------------------------------------------------------------------
// function quantityCorrection(incomingInfo) {
//     incomingInfo.map(x => {
//         // todo add logic: if string has '/' then only do this.
//         if (x.total_quantity) {

//         }
//         x.total_quantity = Number(x.total_quantity.substr(0, Math.floor(x.total_quantity.length / 2)));
//         return x
//     })
//     return incomingInfo
// }


async function getOrders(text, chatId) {
    incomingInfo = await extractOrderInfo(text)
    incomingInfoISIN = populateISINs(incomingInfo, (message)=>{bot.sendMessage(chatId, message)})
    // orderData = quantityCorrection(incomingInfoISIN)
    // orderData = incomingInfoISIN
    incomingInfoISIN.forEach(order => {
        order.date = Date.now()
        order.client_id = chatIdMap[chatId]
    });
    return incomingInfoISIN
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
        const fileRemotePath = fileInfo.file_path // photos/file_4.jpg
        const fileLocalPath = path.join(__dirname, fileRemotePath);

        // download the file
        if (debug) console.log(fileRemotePath);
        await downloadImage(fileRemotePath, fileLocalPath)
        if (debug) console.log('Image downloaded successfully.');
        if (debug) await bot.sendMessage(chatId, 'Image downloaded successfully.');


        // Perform OCR on the downloaded image using async/await
        const { data: { text } } = await Tesseract.recognize(fileLocalPath, 'eng');
        if (debug) console.log('Extracted text:', text);
        if (debug) await bot.sendMessage(chatId, text);

        // clear file at fileLocalPath
        fs.unlinkSync(fileLocalPath)

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

            msg = ""
            jsonData.forEach(data=>{
                msg+= data.price+" "+data.total_quantity+" "+data.tradingsymbol+" "+data.type+"\n";
            })
            await bot.sendMessage(chatId, msg);
            bot.sendMessage(chatId, '👍');
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

