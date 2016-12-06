javascript:(function(){
// ========================================================

// Execute from Traveling Postcards page

if (!window.jQuery)
    $("#mainContentArea").prepend("<div class='success'><b>Try running this from traveling postcards page!</b></div>");

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
            var postcard_page_obj = $('<html />').html(data).find("#postcardControls");
            postcard_page_obj.find("td:nth-child(2)").empty(); // remove social media links
            // ... and add "refresh" icon
            postcard_page_obj.find("td:nth-child(2)").append("<b><a title='Show another random postcard' href='javascript:next_random_postcard();'>next</a></b>");
            postcard_page_obj.find("tbody").append("<tr><td colspan='2' style='margin:0;padding:0;text-align:center;'><a href='"+random_image_url+"'>["+random_image_id+"]</a></td></tr>");
            $("#mainContentArea").empty().append(postcard_page_obj);
        });
    });
}

next_random_postcard();

// ========================================================
})();
