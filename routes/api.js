var express = require('express');
var router = express.Router();
const Phonebook = require('../models/Phonebook')

/* GET home page. */
router.get('/phonebooks', async function(req, res, next) {
  try {
    const phonebooks = await Phonebook.find()
    res.json(phonebooks)
    
  } catch (error) {
    res.status(500).json({message: error.message})
  }
});

module.exports = router;
