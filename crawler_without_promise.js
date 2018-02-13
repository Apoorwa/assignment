var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var stringify = require('csv-stringify');
var async = require('async');
var validator = require('valid-url');

var START_URL = "http://www.medium.com";

var linksToVisit = [];
var allUrls = {};
linksToVisit.push(START_URL);


var crawl = function(){
  var url = linksToVisit.pop();
    if(url in allUrls){
      setTimeout(function(){
        crawl();
      },50);
    }
    else{
      queue.push(url);
      setTimeout(function(){
        crawl();
      },50);
    }
    if(linksToVisit.length == 0){
      done();
      stringify(allUrls, function(err, output) {
        fs.writeFile('./data/urls.csv', output, 'utf8', function(err) {
          if (err) {
            console.log('Some error occured -',err);
          } else {
            console.log('saved!');
          }
        });
    });
  }
}

var queue = async.queue(function(url,callback){
  allUrls[url] = true;
  if(validator.isUri(url)){
    request( url, function(err,res,body){
      if(!err && res.statusCode === 200){
        var $ = cheerio.load(body);
        for(i = 0 ; i < $('a').length; i++){
            var url = $('a').eq(i).attr('href');
            console.log(url);
            linksToVisit.push(url);
        }
        callback();
      }
      else{
        callback(err);
      }
    });
  }
  else{
    callback();
  }
},5);//setting the concurrency to 5

queue.drain = function(){
  done();
}

function done(){
  if (queue.length() == 0){
    console.log("All links found");
  }
}

crawl();
