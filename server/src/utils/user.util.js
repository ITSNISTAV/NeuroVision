const fs = require('fs').promises;
const path = require('path');

const filePath = path.join(__dirname, '../data/users.json');

async function readData() {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

module.exports = { readData };
