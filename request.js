require('dotenv').config();
const OpenAI = require('openai');

// OpenAI API Key from .env file
const apiKey = process.env.YOUR_OPENAI_API_KEY;

// Create an instance of OpenAI client
const client = new OpenAI(apiKey);

// Define the request payload
const payload = {
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What’s in this image?" },
        {
          type: "image_url",
          image_url: {
            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
          }
        }
      ]
    }
  ],
  max_tokens: 300
};

// Make the request to OpenAI API
client.chat.completions.create(payload)
  .then(response => {
    console.log(response.choices[0]);
  })
  .catch(error => {
    console.error(error);
  });
