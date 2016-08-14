javascript:(function(){
// ========================================================

// Execute from Traveling Postcards page

var MAX_GALLERY_PAGE = 62500;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function next_random_postcard() {
    $('#postcardTable_wrapper').empty();
    // get random gallery page
    $.get('https://www.postcrossing.com/gallery/' + randomInt(1,MAX_GALLERY_PAGE), function(data) {
        var gallery_page_obj = $('<html />').html(data);
        // get URLs of all images
        var img_source = gallery_page_obj.find("#postcardImageList li a:last-child").map( function() { return $(this).attr('href'); }).get();
        // get random image page (from the gallery page retrieved above)
        $.get(location.origin + img_source[randomInt(1,img_source.length)], function(data) {
            var postcard_page_obj = $('<html />').html(data).find("#postcardControls");
            postcard_page_obj.find("td:nth-child(2)").empty(); // remove social media links
            // ... and add "refresh" icon
            postcard_page_obj.find("td:nth-child(2)").append("<a href='javascript:next_random_postcard();'><img alt='Show another random postcard' title='Show another random postcard' src='//static1.postcrossing.com/images/indicator.gif' /></a>");
            $("#postcardTable_wrapper").append( postcard_page_obj );
        });
    });
}

next_random_postcard();

// ========================================================
})();
