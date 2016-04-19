var fs = require('fs');

var util = require('util');
var exec = require('child_process').exec;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(80);


app.get("/", function(req, res){
  res.render("index", {"token":Math.floor(Math.random()*2048).toString(16)});
});

var totalUploads = {};
var currentUploads = {};
var erroredUploads = {};

function removeUpload(filename, token){
  for(var i=0; i<currentUploads[token].length; i++){
    if(currentUploads[token][i].filename == filename){
      currentUploads[token].splice(i,1);
      return;
    }
  }
}
var currentJobs;
var maxJobs = 10;
var jobCounter;

function checkThenRun(cmd, job){
  if(currentJobs >= maxJobs){
    console.log("Warning: Max number of current jobs met, waiting 200ms");
    setTimeout(function(){checkThenRun(cmd, job);}, 200);
  }else{
    currentJobs++;
    var child = exec(cmd, function(error, stdout, stderr){ 
      if(error) console.log('Job:'+job+' Error: ' + error);
      else console.log('Job:'+job+' Synced! ' + stdout);
      currentJobs--;
    });
  }
}


app.post("/upload", upload.array("photos", 50), function(req, res){
  var token = req.body.token;
  console.log(token);
  res.redirect("/status?token="+token);

  totalUploads[token] = req.files.length;
  currentUploads[token] = req.files.slice(0, req.files.length);
  erroredUploads[token] = [];

  req.files.forEach(function(file){
    if(file.mimetype.split("/")[0] == "image"){
      var originalPath = __dirname + "/" + file.path;
      var newPath = __dirname + "/public/images/" + file.filename + "." +file.originalname.split(".")[file.originalname.split(".").length-1]
      console.log(newPath)
      fs.rename(originalPath, newPath, function(err){
        if(err){
          erroredUploads[token].push(file.originalname);
          removeUpload(file.filename, token);
          console.log(err);
        }else{
          removeUpload(file.filename, token);
          cmd = 'scp -pr "' + newPath + '" ' + 'khk@10.0.0.10:"' + "/home/admin/photos/_Current (Spring 2016)/unsorted".replace(/(["\s'$`\\()])/g,'\\$1') + '"';
          var job = ++jobCounter;
          console.log('Job:'+job+'\('+currentJobs+'//'+maxJobs+'\) Add/Sync: ', cmd);
          checkThenRun(cmd, job);
        }
      });
      
    }else{
      fs.unlink(file.path);
      erroredUploads[token].push(file.originalname);
      removeUpload(file.filename, token);
    }
  });
});

app.get("/status", function(req, res) {
  res.render("status", {token:req.query.token});
});

app.get("/statusupdate", function(req, res){
  var token = req.query.token;
  res.status(200).send({total:totalUploads[token], pending:currentUploads[token].length, errors:erroredUploads[token]});
});
module.exports = app;

