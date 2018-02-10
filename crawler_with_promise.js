var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var fs = require('fs');
var stringify = require('csv-stringify');

var START_URL = "http://www.medium.com/";
var urls = [];
urls.push(START_URL);
var visitedUrls = {}; //To avoid checking the same page again and again
var maxConnections = 5;
var getPage = function(url){

  return new Promise(function(resolve,reject){
    visitedUrls[url] = true;
    request(url, function(err,res,body){
      if(!err && res.statusCode === 200){
        var $ = cheerio.load(body);
        $('a').each(function(){
          var url = $(this).attr('href');
          // console.log(url);
          if(url in visitedUrls){
            console.log("This url is already been visited : ", url);
          }
          else{
              urls.push(url);
          }
        });
        resolve(urls);
      }
      else{
        reject(err);
      }
    });
  });
}

var crawl = function(url){
  Promise.map(urls, getPage, {concurrency : maxConnections}).then(function(urls){
    let myObj = {};
    myObj['urls'] = urls;
    stringify(myObj.urls, function(err, output) {
      fs.writeFile('./data/urls.csv', output, 'utf8', function(err) {
        if (err) {
            console.log('Some error occured -',err);
        } else {
          console.log('saved!');
        }
      });
    });
  }).catch(function(err){
    if(err){
      console.log("error happened : ", err, "\n");
    }
  });
}

crawl(START_URL);
