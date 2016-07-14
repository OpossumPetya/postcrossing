
// Execute from Traveling Postcards page
// Following columns are expectrd: ID, To Member, To Country, Sent, Traveled (non default), Img
// You may also want to select Display All Cards if you have more than 25 traveling cards

javascript:(function(){
    function getURLParameter(URL, paramName) {
        return decodeURIComponent((new RegExp('[?|&]' + paramName + '=' + '([^&;]+?)(&|#|;|$)').exec(URL)||[,""])[1].replace(/\+/g, '%20'))||null;
    }

    var id = [],
        to_member = [],
        to_country = [],
        sent_date = [],
        travel_days = [],
        img_link = [];

    window.src = {};    // is global, so we can accesss it from asynch functions

    $( "#postcardTable > tbody > tr" ).each(function() {
        id.push($(this).find("td:nth-child(1) > a").text());
        to_member.push($(this).find("td:nth-child(2) > a").text());
        to_country.push($(this).find("td:nth-child(3)").html());
        sent_date.push($(this).find("td:nth-child(4)").text());
        travel_days.push($(this).find("td:nth-child(5)").text());
        img_link.push($(this).find("td:nth-child(6) > a"));
    });

    // called for each $.get(), as they finish
    $(document).ajaxComplete(function(event, xhr, settings) {
        var n = getURLParameter(settings.url, 'num');
        var response = $('<html />').html(xhr.responseText);
        var source = response.find("img");
        window.src[n] = source[0].outerHTML;
    });

    for (var i = 0; i < img_link.length; i++) {
        $.get(img_link[i].attr("href"), {num:i});
    }

    // called when all ajax requests are done
    $(document).ajaxStop(function () {
        $('#postcardTable_wrapper').empty();
        for (var i = 0; i < id.length; i++)
            $('#postcardTable_wrapper').append(window.src[i]);
    });
})();
