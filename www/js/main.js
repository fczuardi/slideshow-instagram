
var tag = 'naturezanacidade';

function getPhotoURLsForTag(tag, cb){
    var backgrounds = [];

    $.getJSON( 'data/response-'+tag+'.json')
    .done(function( data ) {
        $.each( data, function( i, item ) {
            backgrounds.push(
                { src: item.images.standard_resolution.url}
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

//init
$(function() {

var URLParameterTag = getParameterByName('tag');
if (URLParameterTag.length > 0){
    tag = URLParameterTag;
}

getPhotoURLsForTag(tag, function(backgrounds){
    $.vegas('slideshow', {
        backgrounds:backgrounds
    })('overlay', {
        // src:'js/vegas/overlays/01.png'
        src:'js/vegas/overlays/05.png',
        opacity: 0.2
    });
});
});
