var blacklistedUsers = [
    '2449147'
    ];

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

    console.log(li.data('favorite'), isFavorite, userId, userBlacklisted);
        $(this).append(formHTML);
    });
    $('.photo-form').bind('submit',function(ev){
        // ev.preventDefault();
        console.log('form submitted');
    });
    return false;
}
