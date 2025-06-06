require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Calls the Gemini API with the provided prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @param {object} options - Additional options for the Gemini API
 * @returns {Promise<string|null>} - The response text or null if there was an error
 */
const gemini = async (prompt, options = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is missing');
    return null;
  }

  if (!prompt || typeof prompt !== 'string') {
    console.error('Invalid prompt provided to Gemini:', prompt);
    return null;
  }

  try {
    console.log(`Sending prompt to Gemini (${prompt.length} chars)`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: options.model || "gemini-1.5-flash",
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxTokens || 1024,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log(`Received response from Gemini (${responseText.length} chars)`);
    return responseText;
  } catch (error) {
    console.error('Error with Gemini API:', error);
    return null;
  }
}

module.exports = {
    gemini
    };