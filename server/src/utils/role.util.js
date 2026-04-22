const fs = require('fs').promises;
const path = require('path');

const filePath = path.join(__dirname, '../data/roleData.json');

async function readData() {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}
module.exports={readData};