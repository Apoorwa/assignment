var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var reqPool = {maxSockets: 5};
var stringify = require('csv-stringify');

var START_URL = "http://www.medium.com";

var linksToVisit = [];
var allUrls = {};
linksToVisit.push(START_URL);

var getAllLinksOfPage = function($){
  $('a').each(function(){
    var url = $(this).attr('href');
    console.log(url);
    if(url.indexOf('https://') != -1){
      linksToVisit.push(url);
    }
  })
}


var crawl = function(){
  var url = linksToVisit.pop();
    if(url in allUrls){
      crawl();
    }
    else{
      visitPage(url, crawl);
    }
    if(linksToVisit.length == 0){
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

var visitPage = function(url, callback){
  allUrls[url] = true;
  request( {url:url, pool: reqPool}, function(err,res,body){
    var $ = cheerio.load(body);
    getAllLinksOfPage($);
    callback();
  });
}


crawl();
