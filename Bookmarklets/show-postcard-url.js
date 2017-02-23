
// Execute from individual received/sent Postcard page ( https://www.postcrossing.com/postcards/XX-##### )
// Does not work on traveling postcard page, but on that page right-click menu is not disabled

javascript:(function(){
    var url = location.protocol + $("img[class*='postcard-image']").attr("src");
    $("img[class*='postcard-image']").after("<p><br/><input type='text' style='width:500px' onClick='this.select();' value='" + url + "' /></p>");
})();
