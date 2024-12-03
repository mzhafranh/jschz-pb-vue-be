var express = require('express');
var router = express.Router();
var path = require('path');
const Phonebook = require('../models/Phonebook');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.put('/avatar/:id', async function(req, res, next) {
  try {
    console.log('sampai sini')
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
    }
    let id = req.params.id
    const phonebookFind = await Phonebook.findOne({ where: { id } })
    var avatar = req.files.avatar
    var username = phonebookFind.dataValues.name
    var avatarFilename = username + Date.now() + path.extname(avatar.name)
    var filePath = path.join(__dirname, '..', 'public', 'uploads', avatarFilename)
    avatar.mv(filePath, async (err) => {
        if (err) {
          return res.status(500).send(err);
        }
        const phonebook = await Phonebook.update(
            {avatar: avatarFilename},
            {
                where: {
                    id: req.params.id,
                },
                returning: true,
                plain: true
            },
        )
        res.status(201).json(phonebook[1])
    })
} catch (error) {
    res.status(500).json({ message: error.message })
}
});

module.exports = router;
