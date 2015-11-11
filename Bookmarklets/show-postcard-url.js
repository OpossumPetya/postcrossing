
// Execute from individual received/sent Postcard page ( https://www.postcrossing.com/postcards/XX-##### )
// Does not work on traveling Postcard page

javascript:(function(){
    var url = $("#postcardControls img[class*='image-with-shadow']").attr("src");
    $("#postcardControls img[class*='image-with-shadow']").after("<p><br/><input type='text' style='width:500px' onClick='this.select();' value='https:" + url + "' /></p>")
})();
