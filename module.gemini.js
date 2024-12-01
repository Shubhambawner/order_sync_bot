const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_KEY);

const schema = {
  description: "List of trading orders",
  type: SchemaType.ARRAY, // Or whatever your library uses for array type
  items: {
    type: SchemaType.OBJECT, // Or whatever your library uses for object type
    properties: {
      type: {
        type: SchemaType.STRING, // Or whatever your library uses for string type
        description: "Order type (BUY or SELL)",
        enum: ['BUY', 'SELL'], // Restrict to valid values
        nullable: false,
      },
      tradingsymbol: {
        type: SchemaType.STRING,
        description: "Trading symbol",
        nullable: false,
      },
      total_quantity: {
        type: SchemaType.NUMBER, // Or SchemaType.INTEGER if it's always an integer
        description: "Total quantity",
        format: "double", // If using NUMBER, specify integer format
        nullable: false,
        minimum: 1, // Enforce positive quantity
      },
      price: {
        type: SchemaType.NUMBER,
        description: "Price",
        format: "float", // Specify float format for decimal numbers
        nullable: false,
        minimum: 0, // Enforce non-negative price

      },
    },
    required: ["type", "tradingsymbol", "total_quantity", "price"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

async function extractOrderInfo(text) {
  if (text.length==0) return []
  try {
    // Define a prompt to guide the ChatGPT API towards the required JSON structure
    const prompt = text;


    const result = await model.generateContent(prompt);
    // console.log(result.response.text());

    // Parse the JSON response from the assistant's reply
    const replyContent = result.response.text();

    // Attempt to parse JSON from the response content
    const orders = JSON.parse(replyContent);
    // console.log(orders, typeof orders);

    return orders; // Returns the parsed JSON
  } catch (error) {
    console.error("Error extracting order info:", error);
    return []; // Return an empty array on error
  }
}

module.exports = extractOrderInfo
