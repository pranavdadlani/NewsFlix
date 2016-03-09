var sportsCnt, healthCnt, techCnt;
sportsCnt = healthCnt = techCnt = 0;

function incrementCnt(e) {
    var section = $(e.target).data('section');
    console.log(section);
    if ( section == 'Sports' )
        sportsCnt++;
    else if ( section == 'Health' )
        healthCnt++;
    else if ( section == 'Technology' )
        techCnt++;
}

function loadMoreStories() {
    clicks = {
        sports: sportsCnt,
        health: healthCnt,
        technology: techCnt
    };

    $.post( "/loadMoreStories", clicks, function( data ) {
        //create and append the DOM elements
        _.each(data, function(ele) {
            //create outer most a target
            var aStory = document.createElement('a');
            aStory.setAttribute('href', ele.url);
            aStory.setAttribute('target', "_blank");

            //create the story div
            var story = document.createElement('div');
            story.setAttribute('class','story');
            story.setAttribute('data-section',ele.section);

            //img tag with story div
            var img = document.createElement('img');
            img.setAttribute('src', ele.thumbnail_standard);
            img.setAttribute('data-section',ele.section);
            img.setAttribute('class', 'story-img');

            //div to display the title and abstract
            var titleDesc = document.createElement('div');
            titleDesc.setAttribute('class', 'title-desc');
            titleDesc.setAttribute('data-section',ele.section);

            //p tag for title
            var pTitle = document.createElement('p');
            pTitle.setAttribute('data-section', ele.section);
            pTitle.setAttribute('class', 'story-title');
            pTitle.innerHTML = ele.title;

            //p tag for desc
            var pDesc = document.createElement('p');
            pDesc.setAttribute('data-section', ele.section);
            pDesc.setAttribute('class', 'story-abstract');
            pDesc.innerHTML = ele.abstract;

            //create the section badge
            var badge = document.createElement('span');
            badge.setAttribute('data-section', ele.section);
            badge.setAttribute('class', "section-badge badge");            
            badge.innerHTML = ele.section;

            //create delete icon
            var deleteIcon = document.createElement('img');
            deleteIcon.setAttribute('class', 'trash-icon');
            deleteIcon.setAttribute('src', 'images/trash.png');

            //create the extra's div
            var extras = document.createElement('div');
            extras.setAttribute('class', 'extras');
            extras.appendChild(badge);
            extras.appendChild(deleteIcon);

            //create the block by appending
            titleDesc.appendChild(pTitle);
            titleDesc.appendChild(pDesc);
            story.appendChild(img);
            story.appendChild(titleDesc);
            story.appendChild(extras);
            aStory.appendChild(story);
            $('.story-container').append(aStory);
        });
        bindAll();
    });

    cleanCounts();
}

function search() {
    var searchString = $(".welcome-div input").val();
    var postData = {searchString: searchString};
    $.post("/search", postData, function(data) {
        var newDoc = document.open("text/html", "replace");
        newDoc.write(data);
        newDoc.close();
    });
}

function deleteArticle(e) {
    var $ele = $(e.target);
    var href = ele.closest("a").attr("href");
    $.post("/deleteArticle", {href: href}).done(function(resp) {
        $ele.remove();
    })
    .fail(function(err) { 
        console.log(err);
    });
}

function bindAll() {
    $(".story").bind("click", incrementCnt);
    $(".loadMore").bind("click", loadMoreStories);
    $(".trash-icon").bind("click", deleteArticle);
    $('.search-div button').bind('click', search);
    $(".search-div input").bind('keydown', function(e) {
        if ( e.keyCode == 13 )
            search();
    });
}

function cleanCounts() {
    sportsCnt = healthCnt = techCnt = 0;
}

$(document).ready(function() {
    bindAll();
});