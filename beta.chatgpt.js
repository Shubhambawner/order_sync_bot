// const OpenAI = require( 'openai')
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config(); // Load .env only in development
}
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractOrderInfo(text) {
  try {
    // Define a prompt to guide the ChatGPT API towards the required JSON structure
    const prompt = `
    Given the following order text, return an array of JSON objects in the following structure:
    [
        {
            date: <current date>,
            client_id: "<client ID>",
            type: "<order type: BUY/SELL>",
            isin: "<ISIN number>",
            exchange: "<exchange>",
            tradingsymbol: "<symbol>",
            total_quantity: <quantity>,
            price: <price>
        }
    ]

    Order Text:
    "${text}"
    `;

    // Send request to OpenAI API
    const response = await openai.chat.completions.create({
      model: "davinci-002",  // or "gpt-3.5-turbo" if preferred
      messages: [{ role: "user", content: prompt }],
    //   max_tokens: 150,
    });

    // Parse the JSON response from the assistant's reply
    const replyContent = response.choices[0].message.content;

    // Attempt to parse JSON from the response content
    const orders = JSON.parse(replyContent);

    return orders; // Returns the parsed JSON
  } catch (error) {
    console.error("Error extracting order info:", error);
    return []; // Return an empty array on error
  }
}

// Example usage
const orderText = "BUY 10 PENDING ABB 123\nSELL 5 COMPLETE BHEL 150";
extractOrderInfo(orderText).then((orders) => {
  console.log(orders);
});
