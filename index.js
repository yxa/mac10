var skeleton  = require('./skeleton'),
    buildSite = require("./builder");

skeleton('/tmp/test/', 'skeleton', function(error){
  if(error) {
    console.log("Error: could not create build target path!");
  } else {
    buildSite("/tmp/test/",function(error){
      if(error) {
        throw error;
      } else {
        console.log("Success: Generated Static Site!");
      }
    });
  }
});


