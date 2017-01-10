var mongoose = require('mongoose');

module.exports = mongoose.model('phrases', {
  action: {type: String, default: ''},
  level: {type: String, default: ''},
  response: {type: String, default: ''},
  subactions: []
});
