var fs            = require('fs'),
    async         = require('async'),
    Q             = require('q'),
    fs            = require('fs-extra'),
    findit        = require('findit'),
    mde           = require("markdown-extra"),
    markdown      = require('node-markdown').Markdown,
    domain        = require('domain'),
    plates        = require('plates'),
    less          = require('less'),
    pathResolver  = require('./resolver');


var buildSite = function(path, callback) {

 var renderPlates = function(data){
    var def = Q.defer();

    var getTemplate = function(path) {
      var templatePath = path + 'templates/';
      var template = "";

      if(!data.template) {
        template = templatePath + 'layout.html';
      } else {
        template = data.template;
      }
      return template;
    };

    fs.readFile(getTemplate(path),function(err, html){
      if(err) {
        def.reject(err);
      } else {
        var html = plates.bind(html.toString(), data);
        def.resolve(html);
      }
    });
    return def.promise;
 };


  var transCompileLESS = function(file){
    var def = Q.defer();
    fs.readFile(file,function(err,content){
      if(err){
        def.reject(err);
      } else {
        less.render(content.toString(),function(err, css) {
          if(err) {
            def.reject(err);
          } else {
            def.resolve(css);
          }
        });
      }
    });
    return def.promise;
  };

  var getCSSContent = function(file) {
    var def = Q.defer();
    fs.readFile(file, function(err, content){
      if(err){
        def.reject(err);
      } else {
        def.resolve(content);
      }
    });
    return def.promise;
  };

  var persistCSS = function(css, file){
    var def = Q.defer();
    var cssPath = path + 'generated/' + file + '.css';
    fs.writeFile(cssPath, css, function(err){
      if(err){
        def.reject(err);
      } else {
        def.resolve();
      }
    });
    return def.promise;
  };

  var generateCSS = function(path) {
    var def = Q.defer();
    var files = [];
    var styleSheetPath = path + 'styles';
    var finder = findit(styleSheetPath);
    var counter = 0;

    finder.on('file',function(file){
      if(pathResolver.extension(file,['css','less'])){
        files.push(file);
      }
    });

    finder.on('end',function(){
      if(!files.length){
        def.resolve();
      }
      files.forEach(function(file){
        if(pathResolver.extension(file,['less'])){
          transCompileLESS(file)
          .then(function(css){
            var fileShortName = pathResolver.getFileBaseName(file, '.less');
            return persistCSS(css, fileShortName);
          })
          .then(function(){
            counter++;
          })
          .fail(function(err){
            throw err;
          })
          .done(function(){
            if(counter === files.length) {
              def.resolve();
            }
          });
        }

        if(pathResolver.extension(file, ['css'])){
          getCSSContent(file)
          .then(function(css){
            var fileShortName = pathResolver.getFileBaseName(file, '.css');
            return persistCSS(css, fileShortName);
           })
          .then(function(){
            counter++;
           })
          .fail(function(err){
            throw err;
          })
          .done(function() {
            if(counter === files.length) {
              def.resolve();
            }
          });
        }
      });
    });

    finder.on('error',function(error){
      def.reject(error);
    });

    return def.promise;
  };

 var assembleDataObject = function(data){
    var def = Q.defer();
    var data = data.toString();
    var retObj = {};

    mde.metadata(data, function(md){
      md.split('\n').forEach(function(line) {
        var data = line.split(':');
        retObj[data[0].trim()] = data[1].trim();
      });
    });

    retObj.content = markdown(mde.content(data));
    def.resolve(retObj);
    return def.promise;
  };


  var persistHTMLFile = function(file, html) {
    var def = Q.defer();
    var fileName = pathResolver.getFileBaseName(file.split('.')[0] + '.html');
    var htmlPath = path + 'generated/' + fileName;

    fs.writeFile(htmlPath, html, function(err){
      if(err) {
        def.reject(err);
      } else {
        def.resolve();
      }
    });
    return def.promise;
  };

  var readContent = function(file) {
    var def = Q.defer();
    fs.readFile(file, function (err, data) {
      if(err) {
        def.reject(err);
      } else {
        def.resolve(data);
      }
    });
    return def.promise;
  };

  var generateHTML = function(path) {
    var contentPath = path + 'content';
    var finder = findit.find(contentPath);
    var files = [];
    var counter = 0;
    var def = Q.defer();

    finder.on('file',function(file){
      files.push(file);
    });

    finder.on('end', function(){
      files.forEach(function(file){
        if(pathResolver.extension(file,['md'])) {
          readContent(file)
          .then(function(data){
            return assembleDataObject(data);
          })
          .then(function(data){
            return renderPlates(data);
          })
          .then(function(html){
            return persistHTMLFile(file, html);
          })
          .fail(function(err){
            def.reject(err);
          })
          .done(function(){
            def.resolve();
          });
        }
     });
   });

    finder.on('error',function(err){
      throw err;
    });

    return def.promise;
  };

  var createGeneratedDir = function(path) {
    var def = Q.defer();
    var generatedPath = path + 'generated';

    fs.exists(generatedPath, function(exists){
      if(exists) {
        fs.remove(generatedPath,function(error){
          if(error) {
            def.reject(error);
          } else {
            fs.mkdir(generatedPath, function(error){
              if(error) {
                def.reject(error);
              } else {
                def.resolve();
              }
            });
          }
        });
      } else {
        fs.mkdir(generatedPath, function(error) {
          if(error) {
            def.reject(error);
          } else {
            def.resolve();
          }
        });
      }
    });
    return def.promise;
  };

  createGeneratedDir(path)
  .then(function(){
    return generateHTML(path);
  })
  .then(function(){
    return generateCSS(path);
  })
  .then(function(){
    callback();
  })
  .fail(function(err){
    callback(err);
  }).done();

};

module.exports = buildSite;
