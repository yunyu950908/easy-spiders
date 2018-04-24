const mongoose = require('mongoose');
const uri = require('../../setting/config').mongodb;

mongoose.Promise = Promise;
mongoose.connect(uri);

const db = mongoose.connection;

db.on('open', () => {
  console.log('db connected!');
});

db.on('error', (err) => {
  console.error(err);
});

module.exports = db;
