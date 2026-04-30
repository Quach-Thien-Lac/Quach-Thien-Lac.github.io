"use strict";

const fs = require('fs');
const path = require('path');

// Read ./post.txt, build an object, and append it to ./archive/$category.json
function convertTxtToJson() {
    try {
        const raw = fs.readFileSync(path.join(__dirname, 'post.txt'), 'utf8');

        const allLines = raw.split(/\r?\n/);

        // find first non-empty line as category/title
        const firstIndex = allLines.findIndex((l) => l && l.trim() !== '');
        if (firstIndex === -1) throw new Error('post.txt is empty');

        const category = allLines[firstIndex].trim();

        // next up to 3 metadata lines
        const metaLines = allLines.slice(firstIndex + 1, firstIndex + 4);
        const myObject = { category };

        metaLines.forEach((line) => {
            if (!line || !line.includes(':')) return;
            const [key, ...valueParts] = line.split(':');
            const cleanKey = key.trim();
            const cleanValue = valueParts.join(':').trim();
            if (cleanKey && cleanValue) myObject[cleanKey] = cleanValue;
        });

        // rest is content
        const contentLines = allLines.slice(firstIndex + 4);
        const content = contentLines.join('\n').trim();
        myObject['content'] = content;
        myObject['createdAt'] = new Date().toISOString();

        // prepare archive directory and file
        const archiveDir = path.join(__dirname, 'archive');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

        const safeCategory = category.replace(/[\/\\?%*:|"<>]/g, '-').trim();
        const archiveFile = path.join(archiveDir, `${safeCategory}.json`);

        let archiveData = [];
        if (fs.existsSync(archiveFile)) {
            try {
                const existing = fs.readFileSync(archiveFile, 'utf8');
                archiveData = JSON.parse(existing);
                if (!Array.isArray(archiveData)) archiveData = [archiveData];
            } catch (e) {
                archiveData = [];
            }
        }

        archiveData.push(myObject);

        fs.writeFileSync(archiveFile, JSON.stringify(archiveData, null, 2), 'utf8');
        console.log(`Appended post to ${archiveFile}`);
    } catch (err) {
        console.error('Error converting txt to json:', err.message || err);
    }
}

// run on load
convertTxtToJson();
