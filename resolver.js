var path  = require('path'),
    _     = require('underscore');

var extension = function(file, extensions) {
  return _.contains(extensions, getFileExtension(file));
};

var getFileExtension = function(file) {
  return path.extname(file).split('.')[1];
};

var getFileBaseName = function(file, extension) {
  if(extension) {
    return path.basename(file, extension);
  } else {
    return path.basename(file);
  }
};

var pathResolver = {
                      extension: extension,
                      getFileBaseName: getFileBaseName
                   };

module.exports = pathResolver;

