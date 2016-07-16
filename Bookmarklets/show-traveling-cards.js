
// Execute from Traveling Postcards page
// Following columns are expectrd: ID, To Member, To Country, Sent, Traveled (non default), Img
// You may also want to select Display All Cards if you have more than 25 traveling cards

javascript:(function(){
// ========================================================

var TemplateEngine = function(tpl, data) {
    var re = /%([^%]+)?%/g, match;
    while(match = re.exec(tpl)) {
        tpl = tpl.replace(match[0], data[match[1]])
    }
    return tpl;
}

function getURLParameter(URL, paramName) {
    return decodeURIComponent((new RegExp('[?|&]' + paramName + '=' + '([^&;]+?)(&|#|;|$)').exec(URL)||[,""])[1].replace(/\+/g, '%20'))||null;
}

// ---------------------------------------------

var new_style = document.createElement('style');
new_style.type = 'text/css';
new_style.innerHTML = ' \
.cardContainer { \
    margin-bottom:25px; \
    text-align:center; \
} \
.cardInfoWrapper { \
    text-align:center; \
    margin:0; \
    background-color:#fff; \
    color:#3475b9; \
} \
.cardInfo { \
    display: inline-block; \
    white-space: nowrap; \
    font-family: \'Lucida Grande\',Helvetica,Arial,sans-serif; \
    font-size:1.5em; \
    overflow-x:hidden; \
    overflow-y:hidden; \
    max-width:97%; \
} \
.cardId { \
    font-family: Courier,monospace; \
} \
.cardExpired { \
    background-color:#ffebeb; \
} \
.zoomFlag { \
    zoom: 120%; \
} \
';
document.getElementsByTagName('head')[0].appendChild(new_style);

// ---------------------------------------------

var cardInfoTemplate = ' \
<div class=\'cardContainer\'> \
  <div class=\'cardInfoWrapper\'> \
      <div class=\'cardInfo\'> \
        <b class=\'cardId\'>%CARDID%</b> \
        <span style=\'color:#000\'>&#8226;</span> <span class=\'cardTraveled\'>%TRAVELED%</span> \
        <span style=\'color:#000\'>&#8226;</span> %USER% \
        <span style=\'color:#000\'>&#8226;</span> %COUNTRY_FLAG%&nbsp;%COUNTRY% \
      </div> \
  </div> \
  %POSTCARD% \
</div> \
';

// ---------------------------------------------


var id = [],
    to_member = [],
    to_country = [],
    to_country_code = [],
    to_country_flag_img = [],
    sent_date = [],
    travel_days = [],
    img_link = [];

window.src = {};    // is global, so we can accesss it from asynch functions

$('#postcardTable > tbody > tr').each(function() {
    id.push($(this).find('td:nth-child(1) > a').text());
    to_member.push($(this).find('td:nth-child(2) > a').text());
    to_country.push($(this).find('td:nth-child(3) > a').text());
    to_country_code.push($(this).find('td:nth-child(3) > a').attr('href').match(/\w\w$/));
    to_country_flag_img.push($(this).find('td:nth-child(3) > img').addClass('zoomFlag').prop('outerHTML'));
    sent_date.push($(this).find('td:nth-child(4)').text());
    travel_days.push($(this).find('td:nth-child(5)').text());
    img_link.push($(this).find('td:nth-child(6) > a'));
});

// called for each $.get(), as they finish
$(document).ajaxComplete(function(event, xhr, settings) {
    var n = getURLParameter(settings.url, 'num');
    var response = $('<html />').html(xhr.responseText);
    var source = response.find('img');
    window.src[n] = source[0].outerHTML;
});

for (var i = 0; i < img_link.length; i++) {
    $.get(img_link[i].attr('href'), {num:i});
}

// called when all ajax requests are done
$(document).ajaxStop(function () {
    $('#postcardTable_wrapper').empty();
    for (var i = 0; i < id.length; i++)
        $('#postcardTable_wrapper').append(
            TemplateEngine(cardInfoTemplate, {
                CARDID: id[i],
                TRAVELED: travel_days[i],
                USER: to_member[i],
                COUNTRY_FLAG: to_country_flag_img[i],
                COUNTRY: to_country[i],
                POSTCARD: window.src[i]
            })
    );
    $('.cardTraveled:contains(\'expired\')').addClass('cardExpired');
});

// ========================================================
})();
