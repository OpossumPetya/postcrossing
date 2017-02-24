javascript:(function(){
// ========================================================

// not all pages have jQuery loaded
if (!window.jQuery)
    alert("Try running this another page, for example sent postcards pages! (required software library is not used on this page)");

var MAX_GALLERY_PAGE = 62500;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.next_random_postcard = function() {
    $('#mainContentArea').empty().append("<div style='text-align:center;'><span id='sendingIndicator' class='loading-indicator' style='display:block;'><i></i><i></i></span></div>");
    // get random gallery page
    $.get('https://www.postcrossing.com/gallery/' + randomInt(1,MAX_GALLERY_PAGE), function(data) {
        var gallery_page_obj = $('<html />').html(data);
        // get URLs of all images on the selected page
        var img_source = gallery_page_obj.find("ul.postcardImageList li a:last-child").map( function() { return $(this).attr('href'); }).get();
        // get random image (from the gallery page retrieved above)
        var random_image = img_source[randomInt(0,img_source.length-1)];
        var random_image_url = location.origin + random_image;
        var random_image_id = random_image.match(/\w+\-\d+/);
        $.get(random_image_url, function(data) {
            var postcard_page_obj = $('<html />').html(data).find("img[class*='postcard-image']");
            var white_div = $.parseHTML("<div id='showBox' style='background-color:white;text-align:center;clear:both;'></div>");
            $("#mainContentArea").empty().append(white_div);
            $("#showBox")
                 // "next" postcard link
                .append("<b><a title='Show another random postcard' href='javascript:next_random_postcard();'>next</a></b>")
                 // current postcard inage
                .append(postcard_page_obj)
                 // link to the current postcard page
                .append("<a href='"+random_image_url+"'>["+random_image_id+"]</a>")
                ;
        });
    });
}

next_random_postcard();

// ========================================================
})();
