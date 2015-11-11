
// Execute from Traveling Postcards page

javascript:(function(){
    var links = [];
    $( "#postcardTable > tbody > tr > td:nth-child(6) > a" ).each(function() { links.push($(this).attr("href")) });
    
    $('#postcardTable_wrapper').empty();
    for (var i = 0; i < links.length; i++)
        $.get(links[i], {dataType:'html'}).then(function(responseData) {
            var response = $('<html />').html(responseData);
            var source = response.find("img");
            $('#postcardTable_wrapper').append(source[0]);
        });
})();
