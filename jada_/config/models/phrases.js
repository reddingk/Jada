var mongoose = require('mongoose');

module.exports = mongoose.model('phrases', {
  action: {type: String, default: ''},
  type: {type: String, default: undefined},
  level: {type: String, default: ''},
  response: {type: String, default: ''},
  additional_phrases: { type: Array , "default": undefined},
  subactions: { type: Array , "default": undefined}
});
