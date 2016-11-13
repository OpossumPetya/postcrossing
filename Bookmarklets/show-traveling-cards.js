
// Execute from Traveling/Sent/Received Postcards page
// Img column is required, all other are optional
// You may also want to select Display All Cards if you have more than 25 traveling cards.
// Expired cards' travel days is highlighted.

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

var idTemplate = '<b class=\'cardId\'>%CARDID%</b>';
var traveledTemplate = '<span class=\'cardTraveled\'>%TRAVELED%</span>';
var userTemplate = '%USER%';
var countryTemplate = '%COUNTRY_FLAG%&nbsp;%COUNTRY%';

var separatorTemplate = ' <span style=\'color:#000\'>&#8226;</span> ';

var cardInfoTemplate = ' \
<div class=\'cardContainer\'> \
  <div class=\'cardInfoWrapper\'> \
      <div class=\'cardInfo\'> \
        %INFO% \
      </div> \
  </div> \
  %POSTCARD% \
</div> \
';

// ---------------------------------------------

// get available columns
var column = {};
$('.dataTables_scrollHead th').each(function(key, value) {
    // Can be either To Member/Country, or From Member/Country
    if (/member/i.test($(this).text()))
        column['Member'] = key + 1; // css selectors are 1-based
    else if (/country/i.test($(this).text()))
        column['Country'] = key + 1;
    else
        column[$(this).text()] = key + 1;
});

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
    if (column['Postcard ID'])
        id.push($(this).find('td:nth-child('+column['Postcard ID']+') > a').text());
    if (column['Member'])
        to_member.push($(this).find('td:nth-child('+column['Member']+') > a').text());
    if (column['Country']) {
        to_country.push($(this).find('td:nth-child('+column['Country']+') > a').text());
        to_country_code.push($(this).find('td:nth-child('+column['Country']+') > a').attr('href').match(/\w\w$/));
        to_country_flag_img.push($(this).find('td:nth-child('+column['Country']+') > i').addClass('zoomFlag').prop('outerHTML'));
    }
    if (column['Sent'])
        sent_date.push($(this).find('td:nth-child('+column['Sent']+')').text());
    if (column['Traveled'])
        travel_days.push($(this).find('td:nth-child('+column['Traveled']+')').text());
    if (column['Img']) {
        if (/traveling/.test(window.location.href))
            img_link.push($(this).find('td:nth-child('+column['Img']+') > a'));
        else
            img_link.push($(this).find('td:nth-child('+column['Postcard ID']+') > a'));
    }
});

// this gets called for each $.get(), as they finish downloading content
$(document).ajaxComplete(function(event, xhr, settings) {
    var n = getURLParameter(settings.url, 'num');
    var response = $('<html />').html(xhr.responseText);
    var source = response.find('img.image-with-shadow');
    if (source.length == 1)         // traveling card page
        window.src[n] = source[0].outerHTML;
    else if (source.length >= 3)    // sent or received card page (may have comments with user image)
        window.src[n] = source[2].outerHTML;
    else                            // card page without image uploaded
        window.src[n] = '';
});

for (var i = 0; i < img_link.length; i++) {
    $.get(img_link[i].attr('href'), {num:i});
}

// this gets called when all ajax requests are done
$(document).ajaxStop(function () {
    $('#postcardTable_wrapper').empty();
    for (var i = 0; i < img_link.length; i++)
    {
        var info = [];
    
        if (column['Postcard ID'])  info.push(TemplateEngine(idTemplate, { CARDID: id[i] }));
        if (column['Traveled'])     info.push(TemplateEngine(traveledTemplate, { TRAVELED: travel_days[i] }));
        if (column['Member'])    info.push(TemplateEngine(userTemplate, { USER: to_member[i] }));
        if (column['Country'])   info.push(TemplateEngine(countryTemplate, { COUNTRY_FLAG: to_country_flag_img[i], COUNTRY: to_country[i] }));
        
        var info_combined = '';
        if (info.length) info_combined = info.join(separatorTemplate);

        $('#postcardTable_wrapper').append(
            TemplateEngine(cardInfoTemplate, { INFO: info_combined, POSTCARD: window.src[i] })
        );
    }
    $('.cardTraveled:contains(\'expired\')').addClass('cardExpired');
});

// ========================================================
})();
