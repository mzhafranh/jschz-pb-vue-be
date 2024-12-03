const { Schema, model } = require("mongoose");

const phonebookSchema = new Schema({
    name: String,
    phone: String,
    avatar: {
        type: String,
        default: null,
      },
})

module.exports = model('Phonebook', phonebookSchema);