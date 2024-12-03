var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { graphqlUploadExpress } = require('graphql-upload');
const { schema, rootValue } = require('./graphql/schema');
const { createHandler } = require('graphql-http/lib/use/express');
const Phonebook = require('./models/Phonebook');
var fileUpload = require("express-fileupload");

const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/pbdb')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
}

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  createParentPath: true,
}) );
app.use(cors());

app.post('/graphql/avatar/:id', async function (req, res) {
  try {
    // Check if files are uploaded
    if (!req.files || !req.files.avatar) {
      return res.status(400).send('No files were uploaded.');
    }

    const id = req.params.id;

    // Find the phonebook entry using Mongoose
    const phonebookFind = await Phonebook.findById(id);
    if (!phonebookFind) {
      return res.status(404).send('Phonebook entry not found.');
    }

    const avatar = req.files.avatar;
    const username = phonebookFind.name; // Directly access Mongoose fields
    const avatarFilename = username + Date.now() + path.extname(avatar.name);
    const filePath = path.join(__dirname, 'public', 'uploads', avatarFilename);

    console.log(filePath)

    // Move file to the desired location
    avatar.mv(filePath, async (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      // Update the phonebook entry with the avatar's filename
      phonebookFind.avatar = avatarFilename;
      await phonebookFind.save();

      console.log('Updated phonebook entry:', phonebookFind);

      res.status(201).json(phonebookFind); // Return the updated phonebook entry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use(graphqlUploadExpress({
  maxFileSize: 10000000,  // Set max size as needed
  maxFiles: 1,
  onFileUploadStart: (file) => {
    console.log(`Uploading file: ${file.filename}`);
  }
}));

app.use((req, res, next) => {
  console.log('Headers:', req.headers);  // Log request headers to verify content type
  console.log('Body:', req.body);        // Log request body to inspect payload
  next();
});

app.use('/graphql', createHandler({ schema, rootValue }));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
