var http = require('http');
var mongoClient = require('mongodb').MongoClient;
var userProfileCollection;
var db = mongoClient.connect("mongodb://localhost:27017/newsFlixDb",function(err,db){
    if(err)
        throw err; 
    userProfileCollection = db.collection('userProfileCollection');
});

var apiKey = '8c04189a5f178a81036998e47a172f52%3A3%3A73239848';

exports.addNewUser = function (req, res) {
    var loginID = req.body.loginID;
    var passwd = req.body.passwd;

    //validate, add user, redirect accordingly (set cookies)          
    userProfileCollection.find( { loginID: loginID }, function (err,user) {
        if ( user.length>0 ) {
            //error
            return;
        } else {
            res.cookie('loginID', loginID , { expires: false } );
            res.cookie('passwd', passwd, { expires: false } );

            var u = {  
                'loginID': loginID, 
                'passwd': passwd,
                'clicked': {
                    'sports': 0,
                    'health': 0,
                    'technology': 0
                },
                'total': {
                    'sports': 0,
                    'health': 0,
                    'technology': 0
                }
            };
            userProfileCollection.save(u, function (err, saved) {
                if ( saved )
                    console.log('user saved successfully');
                else 
                    console.log('user creation failed!');

                res.redirect('/myFeed');
            });
        }        
    });    
};

exports.logout = function(req, res) {
    res.clearCookie('loginID');
    res.clearCookie('passwd');
    res.redirect('/');
}

exports.authenticateUser = function(req, res) {
   
    
    /*userProfileCollection.find({name:req.body.names,password:req.body.password},{section:true}).toArray(function(err,docs){
        console.log(docs[0].section);

    var loginoptions = {
        host:'api.nytimes.com',
        path: '/svc/news/v3/content/all/'+docs[0].section+'/.json?api-key=' + apiKey,
        method:'GET'

    };
    console.log('Before request');
    var output = '';
    var index =0 ;
    http.request(loginoptions,function(resp){
        //if status = 200 OK
        console.log("request");
        resp.on('data',function(data){
            output+=data;
            console.log('Inside on');
        });

        resp.on('end',function(){
            var obj = JSON.parse(output);
            console.log(obj);
        //  resp.send(obj);        
        });

    }).end();

    });*/
}