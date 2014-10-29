
var tag = 'naturezanacidade';

function getPhotoURLsForTag(tag, cb){
    var backgrounds = [];

    $.getJSON( 'data/response-'+tag+'.json?' + (new Date).getTime())
    .done(function( data ) {
        $.each( data, function( i, item ) {
            backgrounds.push(
                {
                    src: item.images.standard_resolution.url,
                    fade: 1000
                }
            );
        });
        cb(backgrounds);
    });
};

//http://stackoverflow.com/a/901144
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function restartSlideshow(){
    var delay = 5000;
    getPhotoURLsForTag(tag, function(backgrounds){
        var lastSlide = backgrounds.length -1;
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
                if (step === lastSlide) {
                    $.vegas('pause');
                    setTimeout(restartSlideshow, delay);
                }
            }
        );
    });
}

//init
$(function() {

var URLParameterTag = getParameterByName('tag');
if (URLParameterTag.length > 0){
    tag = URLParameterTag;
}
if (window.location.href.indexOf('semanaticket') != -1){
    tag = 'semanaticket';
}
    $('#watermarks').attr('style','display:block;');
    restartSlideshow();
});
