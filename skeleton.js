var fs        = require('fs'),
    async     = require('async'),
    Q         = require('q'),
    fs        = require('fs-extra');

var createSkeleton = function(path, skeletonPath, callback) {

  function createDir(path){
    var def = Q.defer();
    fs.mkdir(path, function(err){
      if(err) {
        def.reject(err);
      } else {
        def.resolve();
      }
    });
    return def.promise;
  };

  function copySkeletonFiles(dest) {
    var def = Q.defer();
    fs.copy(skeletonPath, dest, function(err) {
      if(err) {
        def.reject(err);
      } else {
        def.resolve();
      }
    });
    return def.promise;
  };

  createDir(path)
    .then(function(){
      return copySkeletonFiles(path);
    }).then(function(){
      callback();
    }).fail(function(err){
      callback(err);
    }).done();

};

module.exports = createSkeleton;
