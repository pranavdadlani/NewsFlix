/**
 * Script to fetch data from NY times API's and insert into db
 */

var _ = require('underscore');
var request = require('request');
var mongoClient = require('mongodb').MongoClient;
var articles;
var db = mongoClient.connect("mongodb://localhost:27017/newsFlixDb",function(err,db){
    if(err)
        throw err; 
    articles = db.collection('articles');
});
var offset = 0;
var apiKey = '8c04189a5f178a81036998e47a172f52%3A3%3A73239848';


for ( var i = 0 ; i < 20 ; i++ ) {
	var url = 'http://api.nytimes.com/svc/news/v3/content/all/sports;health;technology/720.json?offset=' + offset + '&api-key=' + apiKey;
	request(url, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        var results = JSON.parse(body).results;
	        console.log('Successfully inserted');
	        articles.insert(results);
	    } else {	    	
	        console.log('In error: ' + error);
	    }
	});
	offset += 10;
}