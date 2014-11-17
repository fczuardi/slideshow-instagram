var blacklistedUsers = [];

function buildAdminUI(){
    console.log('real buildAdminUI');
    var liSet = $('.photo-list li');
    liSet.each(function(index){
        var li = $(this),
            photoId = li.data('id'),
            username = li.data('username'),
            userId = '' + li.data('user-id'),
            isFavorite = li.data('favorite') == 'on',
            isHidden = li.data('hide') == 'on',
            userBlacklisted = blacklistedUsers.indexOf(userId) != -1,
            formHTML = ''+
'<form class="photo-form" action="/api/photos/' +
    photoId + '" method="POST">' +
    '<p class="username">bloquear ' +
        username +
        '<input type="checkbox" name="userBlacklisted" '+
        (userBlacklisted ? 'checked' : '') +
        '/>' +
    '</p>' +
    '<label>favorita <input type="checkbox" name="favorite" '+
    (isFavorite ? 'checked' : '') +'/></label>' +
    '<label>esconder <input type="checkbox" name="hide" '+
    (isHidden ? 'checked' : '') +'/></label>' +
    '<input type="hidden" name="userId" value="'+userId+'" /></label>' +
    '<input type="hidden" name="tag" value="'+tag+'" /></label>' +
    '<br /><input type="submit" value="salvar" />' +
'</form>';
        li.append(formHTML);
        if (userBlacklisted){
            li.attr('data-blocked', 'on');
        }
    });
    $('.photo-form').bind('submit',function(ev){
        // ev.preventDefault();
        console.log('form submitted');
    });
    return false;
}

function getBlockedUsers(){
    var url = '../www/data/blacklist-'+ tag +'.json';
    $.getJSON(url)
    .fail(function() {
        console.log( "Error: Feed unavailable" );
    })
    .done(function( data ) {
        blacklistedUsers = data;
        buildAdminUI();
    });

}

function filterToggle(ev){
    var link = $(this),
        filter = link.data('filter'),
        className = 'filter-'+filter;
    ev.preventDefault();
    console.log('filterToggle', filter);
    $('body').toggleClass(className);
    link.toggleClass('on');
}

function loadMore(ev){
    page += 1;
    $(this).remove();
    displayPictureList();
}

function adminInit(){
    $('.filters a').click(filterToggle);
    $('body').append('<button id="more">More</button>');
    $('#more').click(loadMore);
    getBlockedUsers();
}
