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
		// formatting shit
        let content = contentLines.join('\n').trim();
		content = content.replaceAll('\n', '\n\n');
		content	 = content.replaceAll('\t', ''); 
		content	 = content.replace('content: ', ''); 
		
        myObject['content'] = content;
        myObject['createdAt'] = new Date().toISOString();

        // prepare archive directory and file
        const archiveDir = path.join(__dirname, 'archive');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

        const safeCategory = category.replace(/[\/\\?%*:|"<>]/g, '-').trim();
        const archiveFile = path.join(archiveDir, `${safeCategory}.json`);

        // Helper: create a URL-safe slug from a title
        function slugify(str) {
            return String(str || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[\/\\?%*:|"<>#]/g, '-')
                .replace(/[^\w\-\u00C0-\u024F]+/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        function getTitleKey(obj) {
            if (!obj) return '';
            if (obj.title) return obj.title;
            if (obj.Title) return obj.Title;
            if (obj.name) return obj.name;
            if (obj.slug) return obj.slug;
            return '';
        }

        // Read existing archive file and normalize to an object keyed by slug
        let archiveObj = {};
        if (fs.existsSync(archiveFile)) {
            try {
                const existing = fs.readFileSync(archiveFile, 'utf8').trim();
                if (existing) {
                    const parsed = JSON.parse(existing);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((p) => {
                            const key = slugify(getTitleKey(p) || p.id || p.createdAt || JSON.stringify(p).slice(0, 20));
                            archiveObj[key || Date.now().toString()] = p;
                        });
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        archiveObj = parsed;
                    }
                }
            } catch (e) {
                archiveObj = {};
            }
        }

        // Determine key for new post
        const rawTitle = getTitleKey(myObject) || myObject.title || myObject.name || '';
        let key = slugify(rawTitle || myObject.createdAt || Date.now());

        // Ensure unique key: append suffix if collision
        if (archiveObj[key]) {
            let i = 1;
            while (archiveObj[`${key}-${i}`]) i += 1;
            key = `${key}-${i}`;
        }

        myObject.id = key;
        archiveObj[key] = myObject;

        fs.writeFileSync(archiveFile, JSON.stringify(archiveObj, null, 2), 'utf8');
        console.log(`Wrote post under key '${key}' to ${archiveFile}`);
    } catch (err) {
        console.error('Error converting txt to json:', err.message || err);
    }
}

// run on load
convertTxtToJson();
