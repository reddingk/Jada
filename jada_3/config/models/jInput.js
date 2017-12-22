var mongoose = require('mongoose');

module.exports = mongoose.model('jInput', {
  name: {type: String, default: ''},
  phrase: {type: String, default: ''}
});
