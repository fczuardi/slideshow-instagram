var delay = 5000,
    backgrounds = [],
    lastSlide = 19,
    tag = 'naturezanacidade',
    isAdminURL = window.location.href.indexOf('admin') != -1,
    URLParameterDisplay = '',
    page = 0,
    hasNextPage = false;

function getPhotoURLsForTag(tag, cb, cachedFeed){
    if (hasNextPage) {
        page += 1;
    }else {
        page = 0;
    }
    var bg = [],
        url = (cachedFeed === true) ?
                    'data/response-'+tag+
                        '-page-'+page+'.json' :
                    'data/response-'+tag+
                        '-page-'+page+'.json?'+
                        (new Date).getTime();
    $.vegas('destroy');
    $('body').unbind('vegaswalk');
    $.getJSON( url)
    .fail(function() {
        console.log( "Error: Feed unavailable" );
        console.log('keep using the feed we have...');
        hasNextPage = false;
        startSlideshow();
    })
    .done(function( data ) {
        console.log(data.length)
        $.each( data, function( i, item ) {
            // if (i > 1){return;}
            bg.push(
                {
                    src: item.images.standard_resolution.url,
                    link:item.link,
                    user:item.user,
                    fade: 1000
                }
            );
            if (i == data.length -1){
                console.log('last photo item', item.nextFeed !== undefined);
                hasNextPage = (item.nextFeed !== undefined);
            }
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
        preload: true,
        backgrounds:backgrounds
    })('overlay', {
        // src:'js/vegas/overlays/01.png'
        src:'js/vegas/overlays/05.png',
        opacity: 0.2
    });
    $('body').bind('vegaswalk',
        function(e, bg, step) {
            //click on the image open photo on instagram
            $('#click-overlay').attr('href', backgrounds[step].link);
            //user icon and user name of the author on the credits div
            // $('#author-icon').attr('src',
                            // backgrounds[step].user.profile_picture);
            $('#author-link').attr('href',
                    'http://instagram.com/'+backgrounds[step].user.username
                ).text('foto: '+ backgrounds[step].user.username);
            if (step === lastSlide) {
                $.vegas('pause');
                setTimeout(restartSlideshow, delay);
            }
        }
    );
}
function restartSlideshow(cachedFeed){
    getPhotoURLsForTag(tag, function(){
        startSlideshow();
    }, cachedFeed);
}

function adminInit(){
    console.log('use a URL correta.');
    return false;
}
function displayPictureList(){
    var filename = 'data/response-'+tag+
                    (isAdminURL ? '-admin': '') +
                    '-page-'+page+
                    '.json?' + (new Date).getTime(),
        url = isAdminURL ? ('../www/' + filename) : filename,
        html = '<ul class="photo-list">';
    $.getJSON(url)
    .fail(function() {
        console.log( "Error: Feed unavailable" );
    })
    .done(function( data ) {
        $.each( data, function( i, item ) {
            var image = item.images.thumbnail;
            html += '<li data-id="'+item.id+'"'+
                    'data-username="'+item.user.username+'"'+
                    'data-user-id="'+item.user.id+'"'+
                    'data-favorite="'+item.slideshow_favorite+'"'+
                    'data-hide="'+item.slideshow_hide+'"'+
                    '><a href="'+item.link+
                    '"><img src="'+image.url+
                    '" width="'+image.width+
                    '" height="'+image.height+'" ></a></li>';
        });
        html += '</ul>';
        if (URLParameterDisplay == 'list' || isAdminURL){
            html += '<button id="more">More</button>';
            $('body').append(html);
            $('#more').click(loadMore);
        } else {
            $('body').append(html);
        }
        if (isAdminURL){
            adminInit();
        }
    });
}

function loadMore(ev){
    page += 1;
    $(this).remove();
    displayPictureList();
}



//init
$(function() {

var URLParameterTag = getParameterByName('tag');

URLParameterDisplay = getParameterByName('display');
if (URLParameterTag.length > 0){
    tag = URLParameterTag;
}
if (window.location.href.indexOf('semanaticket') != -1){
    tag = 'semanaticket';
}
if (URLParameterDisplay != 'list' && !isAdminURL){
    restartSlideshow(true);
}else{
    displayPictureList();
    $('#watermarks, #click-overlay').css('display','none');
}

});
