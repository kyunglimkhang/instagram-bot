require("dotenv").config();

const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const fs = require('fs').promises;
const path = require('path');
const xlsx = require('xlsx');
const Jimp = require('jimp');

const { IgApiClient } = require('instagram-private-api');

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const ig = new IgApiClient();

const postCarouselWithCaptions = async () => {
    const igUsername = process.env.IG_USERNAME; 
    ig.state.generateDevice(igUsername);
    await ig.account.login(igUsername, process.env.IG_PASSWORD);

    // Read captions from CSV file
    const csvFilePath = path.join(`./data/${igUsername}`, 'responses.csv');
    const csvData = await fs.readFile(csvFilePath, 'utf-8');
    const captions = csvData.trim().split('\n');

    // Read default hashtag from hash_tag.txt
    const hashTagFilePath = path.join(`./data/${igUsername}`, 'hash_tag.txt');
    const hashTagData = await fs.readFile(hashTagFilePath, 'utf-8');
    const defaultHashTag = hashTagData.trim();

    // Iterate over subdirectories in ./data folder
    const imgDir = `./data/${igUsername}`;
    const entries = await fs.readdir(imgDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const folderPath = path.join(imgDir, entry.name);
            const files = await fs.readdir(folderPath);
            const images = [];

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);

                if (stat.isFile()) {
                    // Check if file is PNG
                    if (/\.png$/i.test(file)) {
                        // Convert PNG to JPEG
                        const image = await Jimp.read(filePath);
                        const jpegBuffer = await image.quality(100).getBufferAsync(Jimp.MIME_JPEG);
                        const uploadId = Date.now().toString();
                        images.push({ file: jpegBuffer, uploadId });
                    } else {
                        const imageBuffer = await fs.readFile(filePath);
                        const uploadId = Date.now().toString();
                        images.push({ file: imageBuffer, uploadId });
                    }
                }
            }

            if (images.length > 0) {
                const captionIndex = entries.indexOf(entry);
                console.log(images);
                await ig.publish.album({
                    caption: `${captions[captionIndex-1] || 'Default caption'}\n\n${defaultHashTag}`,
                    items: images
                });
            }
        }
    }
};

postCarouselWithCaptions();
