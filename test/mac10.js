var assert    = require("assert"),
    chai      = require('chai'),
    fs        = require("fs-extra"),
    async     = require('async'),
    resolver  = require('../resolver'),
    index     = require('../index');

var skeleton = index.skeleton;
var builder = index.builder;

var expect = chai.expect;

describe('Build Target Directory', function(){

  var buildTarget = "/tmp/whatever/";
  var skeletonPath = "test/skeleton";
  var folders = ['content', 'styles', 'templates'];
  var files = [buildTarget + 'generated/' + 'test.html', buildTarget + 'generated/' + 'screen.css'];
  var counter = 0;
  var folderSize = folders.length;


  describe('create skeleton', function(){
    after(function(done){
      fs.remove(buildTarget, function (err) {
        if (err) {
          done(err);
        } else {
          counter = 0;
          done();
        }
      });
    });

    it('should create the target build dictory', function(done){
      skeleton(buildTarget, skeletonPath, function(error) {
            expect(error).to.not.exists;
            fs.exists(buildTarget,function(exists){
            expect(exists).to.be.true;
            folders.map(function(folder){
            fs.exists(buildTarget + folder,function(exists){
              expect(exists).to.be.true;
              counter++;
              if(counter === folderSize){ done(); }
            });
          });
        });
      });
    });

    it('should fail when trying to create build directory when already exists',function(done){
      skeleton(buildTarget, skeletonPath, function(error) {
        expect(error).to.exists;
        done();
      });
    });
  })

  describe('build target',function() {
    afterEach(function(done){
      fs.remove(buildTarget, function (err) {
        if (err) {
          done(err);
        } else {
          counter = 0;
          done();
        }
      });
    });

    it('should create generated folder from building',function(done){
      skeleton(buildTarget, skeletonPath, function(error) {
          expect(error).to.not.exists;
          builder(buildTarget, function(status){
            expect(status).to.be.undefined;
            fs.exists(buildTarget + 'generated', function(exists){
              expect(exists).to.be.true;
              async.filter(files, fs.exists, function(results){
                expect(results).to.have.length(2);
                done();
              });
            });
          });
      });
    });
  });
});

describe('Filename Resolver',function(){
  it('should return extension true', function(done){
    resolver.extension("test.md",['md','markdown','mdown']) && done();
  });

  it('should return file base name without extension',function(done){
    var name = resolver.getFileBaseName("/tmp/whatever/test.md",'.md');
    expect(name).to.equal("test");
    done();
  });

  it('should return the file name with extension',function(done){
    var name = resolver.getFileBaseName("/tmp/whatever/test.md");
    expect(name).to.equal("test.md");
    done();
  });
});
