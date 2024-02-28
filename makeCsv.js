require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

// OpenAI API Key from .env file
const apiKey = process.env.YOUR_OPENAI_API_KEY;
// Create an instance of OpenAI client
const client = new OpenAI(apiKey);

// Array to store responses
const responses = [];

// Function to encode the image to base64
function encodeImage(imagePath) {
    return fs.readFileSync(imagePath, { encoding: 'base64' });
}

// Function to send request to OpenAI API for a single image
async function sendRequestToOpenAI(imagePath) {
    const base64Image = encodeImage(imagePath);

    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Write down what a funny woman would say while admiring a handsome man in a photo, in a single five-line sentence with appropriate exclamations. See the example below.\n\nWooooof. Who doesn’t adore a man reading while ALSO toting his best friend around the city? My only worry is that with a bond that strong, I might have some stiff competition for the other spot in his bed. At least I can guarantee a lot less snoring #ButNoLessDrooling #NewMeaningToDoggyStyle  #HDRarchives #hotdudesreading\n\nSpotted: Pedro Pascal looking lost in a book like Joel in the tunnels of Kansas City. That ripped white t-shirt is doing things to me that even a health kit can't fix. I’m over here imagining him protecting me from the Infected, and it has my heart racing faster than if a Clicker was after me. 10/10 sure, yea, I’d let him infect me with his mushroom any day. #WhoreForHisCordyceps #hotdudesreading #thelastofus"
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 300
    };

    try {
        const response = await client.chat.completions.create(payload);
        responses.push(response.choices[0].message);
    } catch (error) {
        console.error(error);
    }
}

// Function to find the first image in each subdirectory of ./data
async function findFirstImagesInSubdirs(igUsername) {
    const imgDir = `./data/${igUsername}`;
    const subdirs = fs.readdirSync(imgDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    console.log("subdirs", subdirs);

    for (const subdir of subdirs) {
        const files = fs.readdirSync(path.join(imgDir, subdir));
        const firstImage = files.find(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        if (firstImage) {
            const imagePath = path.join(imgDir, subdir, firstImage);
            await sendRequestToOpenAI(imagePath);
        }
    }
}

// Main function to execute the process
async function main() {
    const igUsername = process.env.IG_USERNAME; 
    await findFirstImagesInSubdirs(igUsername);

    // Write responses to CSV file
    if (responses.length > 0) {
        const csvData = responses.map(response => ({
            role: response.role,
            content: response.content
        }));
        const csv = parse(csvData);
        const csvPath = `./data/${igUsername}/responses.csv`;
        fs.writeFileSync(csvPath, csv, 'utf-8');
        console.log('Responses written to responses.csv');
    } else {
        console.log('No responses to write.');
    }
}

main();
