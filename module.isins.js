// const fs = require('fs');
// const path = require('path');
const localDataJson = require('./module.isinData');


// Path to the local JSON database file
// const dbPath = path.join(__dirname, 'isinData.json');

// Function to load the local symbol-ISIN map from the JSON file
// async function loadLocalDb() {
//     try {
//         const data = await new Promise((resolve, reject) => {
//             fs.readFile(dbPath, 'utf-8', (err, data) => {
//                 if (err) {
//                     reject(err)
//                 }
//                 resolve(data)
//             });
//         })
//         return JSON.parse(data);
//     } catch (error) {
//         console.error("Error loading local DB:", error.message);
//         return {}; // Return an empty object if file doesn't exist or fails to load
//     }
// }
// Function to populate ISINs for stock orders using only local DB
function populateISINs(stockOrders) {
    // Load the local symbol-ISIN map from the JSON file
    // if (!localDataJson) {
    //     localDataJson = await loadLocalDb();
    //     console.log('local db loaded')
    // }
    stockOrdersCopy = structuredClone(stockOrders)
    // Map each stock order to its ISIN from the local DB
    const updatedOrders = stockOrdersCopy.map((stockOrder) => {
        const { tradingsymbol } = stockOrder;

        // Check if the ISIN exists in the local DB
        if (localDataJson[tradingsymbol]) {
            stockOrder.isin = localDataJson[tradingsymbol][0]; // Use the ISIN from the local DB
        } else {
            console.error(`ISIN not found for tradingsymbol: ${tradingsymbol}`);
            // stockOrder.isin = 'ISIN not found'; // Mark as not found
        }

        return stockOrder; // Return updated stock order
    }) || [];
console.log(updatedOrders);

    return updatedOrders;
}

module.exports = populateISINs