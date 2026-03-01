const path = require('path')

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

module.exports = {
  DATA_DIR,
  USERS_FILE,
}
