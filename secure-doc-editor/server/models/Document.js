const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  versionHistory: [{
    content: String,
    timestamp: { type: Date, default: Date.now },
    author: String,
    message: String,
  }],
});

documentSchema.methods.addVersion = function(content, author, message) {
  const version = { content, author, message, timestamp: new Date() };
  this.versionHistory.push(version);
  this.content = content;
  this.save();
  return version;
};

module.exports = mongoose.model('Document', documentSchema);
