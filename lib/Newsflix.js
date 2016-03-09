/**
 * Module fetches news from newyorktimes.com and renders
 * the ones most appropriate for the user
 */
var noOfArticles = 20; //number of articles displayed at one time
var threshold = 0.8; //max articles of one section that can be shown
var $ = require('jquery-deferred');
var _ = require('underscore');
var request = require('request');
var mongoClient = require('mongodb').MongoClient;
var userProfileCollection, articles;
var db = mongoClient.connect("mongodb://localhost:27017/newsFlixDb",function(err,db){
    if(err)
        throw err; 
    userProfileCollection = db.collection('userProfileCollection');
    articles = db.collection('articles');
});
var apiKey = '8c04189a5f178a81036998e47a172f52%3A3%3A73239848';

exports.renderFeed = function(req, res) {
    //get cookie
    var loginID = req.cookies.loginID;
    var passwd = req.cookies.passwd;    

    //retrieve, save and render
    userProfileCollection.findOne({"loginID": loginID}, function(err, user) {

        var sportsCnt = user.total.sports, healthCnt = user.total.health, techCnt = user.total.technology;
        if ( isNewUser(user) ) {//new user with no record
            articles.find().toArray(function(error, data){
                 if (!error) {
                    var results = data;
                    var totalCnt = {};
                    _.each(results, function(story) {
                        if ( story.section == "Sports" )
                            sportsCnt++;
                        else if ( story.section == "Health" )
                            healthCnt++;
                        else if ( story.section == "Technology" )
                            techCnt++;
                    });
                    totalCnt = {
                        'sports': sportsCnt,
                        'health': healthCnt,
                        'technology': techCnt
                    };
                    saveNewUserData(user, totalCnt);
                    res.render('myFeed',{'data': results});
                } else {
                    console.log(error);
                }
            });            
        } else {//returning user
            renderReturningUserFeed(user, res, false);
        }
    });
}

/**
 * This method is called due to ajax req. Update clicked
 * and call renderReturningUserFeed with isAjax = true
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.loadMoreStories = function(req, response) {
    var cookie = req.cookies;
    var clickedTotal = {
        'sports': 0,
        'health': 0,
        'technology': 0
    };

    //update clicked to include latest info
    userProfileCollection.findOne({"loginID": cookie.loginID}, function(err, user) {
        var keys = _.keys(user.clicked);
        _.each(keys, function(key) {
            clickedTotal[key] = Number(user.clicked[key]) + Number(req.body[key]);
        });

        userProfileCollection.update(
            {loginID: user.loginID},
            { $set: {clicked: clickedTotal} },
            function(err, res) {
                if (err)
                    throw err;
                else {
                    user.clicked = clickedTotal;
                    renderReturningUserFeed(user, response, true);
                }
            }
        );
    });
}

/**
 * Method to delete article from db whoes href is provided
 * @param  {[type]} href [description]
 * @return {[type]}      [description]
 */
// exports.deleteArticle = function(href, res) {
//     articles.remove({ href : href });
//     res.send({result: true});
// }

/**
 * takes search string, queries mongo, and displays those search results to the user
 * @param  {[type]} searchString [description]
 * @return {[type]}              [description]
 */
exports.search = function(searchString, res) {
    articles.find( { $text: { $search: searchString } }).toArray(function(err, data) { 
        if (!err) {
            res.render('myFeed',{'data': _.initial(data, data.length-20)});
        } else {
            console.log(err);
        }
    });
};

/**
 * fetch and serve feed according to users pref intellegently
 * @return {[type]} [description]
 */
function renderReturningUserFeed(user, res, isAjax) {

    var sportsPer, healthPer, techPer;
    var sportsToShow, healthToShow, techToShow;
    var sportsDef = $.Deferred();
    var healthDef = $.Deferred();
    var techDef = $.Deferred();
    var total = user.total;
    var clicked = user.clicked;

    sportsPer = clicked.sports/total.sports;
    healthPer = clicked.health/total.health;
    techPer = clicked.technology/total.technology;
    var denom = sportsPer + healthPer + techPer;

    sportsPer = sportsPer/denom;
    healthPer = healthPer/denom;
    techPer = techPer/denom;

    //thresholding
    if ( sportsPer >= threshold ) {
        sportsPer = threshold;
        healthPer = 0.1;
        techPer = 0.1;
    } else if ( healthToShow >= threshold ) {
        sportsPer = 0.1;
        healthPer = threshold;
        techPer = 0.1;
    } else if ( techToShow >= threshold ) {
        sportsPer = 0.1;
        healthPer = 0.1;
        techPer = threshold;
    }

    //actual no of articles being show
    if ( isNewUser(user) ) {
        sportsToShow = healthToShow = techToShow = 6;
    } else {
        sportsToShow = Math.floor(sportsPer*noOfArticles);
        healthToShow = Math.floor(healthPer*noOfArticles);
        techToShow = Math.floor(techPer*noOfArticles);
    }

    //get articles of all 3 sections
    articles.find({sections: 'Sports'}).toArray(function(error, data) {
        if (!error) {
            sportsDef.resolve(data);
        } else {
            console.log(error);
        }
    });
    
    articles.find({section: 'Health'}).toArray(function(error, data) {
        if (!error) {
            healthDef.resolve(data);
        } else {
            console.log(error);
        }
    });
    
    articles.find({section: 'Technology'}).toArray(function(error, data) {
        if (!error) {
            techDef.resolve(data);
        } else {
            console.log(error);
        }
    });    

    //consolidate right number of articles from each section and render.
    $.when(sportsDef, healthDef, techDef).done(function(sports, health, tech) {
        //randomize
        shuffle(sports);
        shuffle(health);
        shuffle(tech);
        console.log(sportsToShow + ' ' + healthToShow + ' ' + techToShow);
        //keep only as many as you want to serve
        sports = sports.slice(1, sportsToShow);
        health = health.slice(1, healthToShow);
        tech = tech.slice(1, techToShow);

        //concat arrays and shuffle again
        var articles = _.union(sports, health, tech);
        shuffle(articles);

        if ( isAjax )
            res.send(articles);
        else
            res.render('myFeed',{'data': articles});
    });
}

function saveNewUserData(user, totalCnt) {
    userProfileCollection.update(
        {loginID: user.loginID},
        { $set: {total: totalCnt} },
        function(err, res) {
            if (err)
                throw err;
        }
    );
}

/**
 * As good as new user if no news have been clicked on
 * @return {Boolean} [description]
 */
function isNewUser(user) {
    if ( user.clicked.sports == 0 && 
         user.clicked.health == 0 && 
         user.clicked.technology == 0 )
        return true;
    else 
        return false;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}