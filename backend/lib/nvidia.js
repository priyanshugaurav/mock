const axios = require('axios');
require('dotenv').config();

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const apiKey = process.env.NVIDIA_API_KEY;

/**
 * Generates content using the specified NVIDIA model.
 */
async function generateNvidiaCompletion(messages, model = "nvidia/nemotron-3-nano-30b-a3b") {
  const payload = {
    model: model,
    messages: messages,
    max_tokens: 5000,
    temperature: 0.1,
    top_p: 0.9,
    stream: false,
    response_format: { type: "json_object" } // Nemotron/Llama support this
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("NVIDIA API Error:", error.response?.data || error.message);
    throw new Error(`NVIDIA Completion Failed: ${error.message}`);
  }
}

module.exports = { generateNvidiaCompletion };
