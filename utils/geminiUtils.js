require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");


const gemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is missing');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return null;
  }
}

module.exports = {
    gemini
    };