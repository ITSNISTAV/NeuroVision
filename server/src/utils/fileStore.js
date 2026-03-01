const fs = require('fs')
const path = require('path')

function ensureFile(filePath, fallback) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8')
  }
}

function readJson(filePath, fallback = []) {
  ensureFile(filePath, fallback)
  const raw = fs.readFileSync(filePath, 'utf-8')
  try {
    return JSON.parse(raw || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function writeJson(filePath, data) {
  const tmp = `${filePath}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, filePath)
}

module.exports = { readJson, writeJson }


