var delay = 5000,
    backgrounds = [],
    lastSlide = 19,
    tag = 'naturezanacidade',
    isAdminURL = window.location.href.indexOf('admin') != -1;

function getPhotoURLsForTag(tag, cb){
    var bg = [];
    console.log('destroy')
    $.vegas('destroy');
    $('body').unbind('vegaswalk');
    $.getJSON( 'data/response-'+tag+'.json?' + (new Date).getTime())
    .fail(function() {
        console.log( "Error: Feed unavailable" );
        startSlideshow();
    })
    .done(function( data ) {
        $.each( data, function( i, item ) {
            // if (i > 1){return;}
            bg.push(
                {
                    src: item.images.standard_resolution.url,
                    link:item.link,
                    fade: 1000
                }
            );
        });
        backgrounds = bg;
        lastSlide = backgrounds.length -1;
        cb();
    });
};

//http://stackoverflow.com/a/901144
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function startSlideshow(){
    $.vegas('slideshow', {
        delay: delay,
        backgrounds:backgrounds
    })('overlay', {
        // src:'js/vegas/overlays/01.png'
        src:'js/vegas/overlays/05.png',
        opacity: 0.2
    });
    $('body').bind('vegaswalk',
        function(e, bg, step) {
            $('#click-overlay').attr('href', backgrounds[step].link);
            if (step === lastSlide) {
                $.vegas('pause');
                setTimeout(restartSlideshow, delay);
            }
        }
    );
}
function restartSlideshow(){
    getPhotoURLsForTag(tag, function(){
        startSlideshow();
    });
}

function buildAdminUI(){
    console.log('use a URL correta.');
    return false;
}
function displayPictureList(){
    var filename = 'data/response-'+tag+'-30.json?' + (new Date).getTime(),
        url = isAdminURL ? ('../www/' + filename) : filename,
        html = '<ul class="photo-list">';
    $.getJSON(url)
    .fail(function() {
        console.log( "Error: Feed unavailable" );
    })
    .done(function( data ) {
        $.each( data, function( i, item ) {
            var image = item.images.thumbnail;
            html += '<li data-id="'+item._id+'"'+
                    'data-username="'+item.user.username+'"'+
                    '><a href="'+item.link+
                    '"><img src="'+image.url+
                    '" width="'+image.width+
                    '" height="'+image.height+'" ></a></li>';
        });
        html += '</ul>';
        $('body').append(html);
        if (isAdminURL){
            buildAdminUI();
        }
    });
}

//init
$(function() {

var URLParameterTag = getParameterByName('tag'),
    URLParameterDisplay = getParameterByName('display');
if (URLParameterTag.length > 0){
    tag = URLParameterTag;
}
if (window.location.href.indexOf('semanaticket') != -1){
    tag = 'semanaticket';
}
if (URLParameterDisplay != 'list' && !isAdminURL){
    restartSlideshow();
}else{
    displayPictureList();
    $('#watermarks, #click-overlay').css('display','none');
}

});
