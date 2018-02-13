var request = require('request');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var validator = require('valid-url');
var fs = require('fs');
var stringify = require('csv-stringify');


var urls= [];
var allUrls = [];
var visitedUrls = {};
var START_URL = 'http://www.medium.com';
urls.push(START_URL);
allUrls.push(START_URL);
const maxConnections = 5;

var fetchPageLinks = function(url){
  console.log("fetching page : ", url);
  return new Promise(function(resolve, reject){
    if(validator.isUri(url)){
      if(url in visitedUrls){
        resolve(urls);
      }
      else{
        visitedUrls[url] = true;
        urls.splice(urls.indexOf(url),1);
        request(url,function(err,res){
          if(!err && res.statusCode === 200){
            var $ = cheerio.load(res.body);
            $('a').each(function(){
              var url = $(this).attr('href');
              if(url in visitedUrls){
                // console.log(url + " skipping as already visited");
              }
              else{
                urls.push(url);
                allUrls.push(url);
              }
            });
            resolve(urls);
          }
          else{
            reject(err);
          }
        });
      }
    }
    else{
      urls.splice(urls.indexOf(url),1);
      resolve(urls)
    };
  });
}


var crawl = function(urls){
  Promise.map(urls, fetchPageLinks, {concurrency: maxConnections}).then(function(result){
    if(result[0].length){
      console.log(result[0].length);
      return crawl(result[0]);
    }
  }).finally(function(){
    let myObj = {};
    myObj['urls'] = allUrls;
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
      console.log("Error : ", err);
    }
  });
}

crawl(urls);
