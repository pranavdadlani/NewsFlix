var http = require('http');
var apiKey = '8c04189a5f178a81036998e47a172f52%3A3%3A73239848';
var express = require('express');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var userProfileCollection;
var mongoClient = require('mongodb').MongoClient;
var db = mongoClient.connect("mongodb://localhost:27017/newsFlixDb",function(err,db){
    if(err)
        throw err; 
    userProfileCollection = db.collection('userProfileCollection');
});
var path = require('path');
var users = require('./lib/Users');
var newsflix = require('./lib/Newsflix');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/public/templates');
app.set('view engine', 'jade');

var options = {
    host:'api.nytimes.com',
    path: '/svc/news/v3/content/all/all/.json?api-key=' + apiKey,
    method:'GET'
};
app.get('/', function(req,res){
    res.sendFile(__dirname + '/public/html/home.html');
});
//end of declarations

//begin hooks

//login and auth
app.get('/login',function(req,res){
    res.sendFile(__dirname + '/public/html/login.html');
});

app.post('/authenticate',function(req,res) {
    var user = {};
    var loginID = req.body.loginID;
    var passwd = req.body.passwd;

    userProfileCollection.findOne({"loginID": loginID}, function(err, user) {
        if ( err )
            console.log(err);
        if ( user === null )
            res.sendFile(__dirname + '/public/html/noSuchUser.html');
        else if ( user.passwd !== passwd )
            res.sendFile(__dirname + '/public/html/noSuchUser.html');
        else {
            res.cookie('loginID', user.loginID , { expires: false });
            res.cookie('passwd', user.passwd, { expires: false });
            res.redirect('/myFeed');
        }
    });
});

//register and adduser
app.get('/register',function(req,res) {
    res.sendFile(__dirname + '/public/html/register.html');
});

app.post('/addUser', function(req, res) {
    users.addNewUser(req,res);
});

app.get('/allNews', function(req,resp) {
    var output = '';
    var index =0 ;
    http.request(options,function(res){
        //if status = 200 OK
        res.on('data',function(data){
            output+=data;
        });

        res.on('end',function(){
            var obj = JSON.parse(output);
            resp.send(obj);
        });
    }).end();
});

app.get('/myFeed', function(req, res) {
    var cookie = req.cookies;
    if ( cookie.loginID === undefined && cookie.passwd === undefined ) {
        console.log("Please login to see your personlized feed");
    } else {
        newsflix.renderFeed(req, res);
    }
});

app.post('/loadMoreStories', function(req, res) {
    var cookie = req.cookies;
    if ( cookie.loginID === undefined && cookie.passwd === undefined ) {
        console.log("Please login to see your personlized feed");
    } else {
        newsflix.loadMoreStories(req, res);
    }    
});

//log user out
app.get('/logout', function(req, res) {
    users.logout(req, res);
});

//delete a article
app.post('/deleteArticle', function(req, res) {
    newsflix.deleteArticle(req.body.href, res);
});

//search functionality 
app.post('/search', function(req, res) {
    newsflix.search(req.body.searchString,res);
});

var server = app.listen(4325, function() {

});