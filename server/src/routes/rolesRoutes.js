const express = require('express');
const router = express.Router();
const { getAllRoles, getRoleByName } = require('../controllers/rolesController');

router.get('/', getAllRoles);
router.get('/:roleName', getRoleByName);

module.exports = router;
