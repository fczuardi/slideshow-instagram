var blacklistedUsers = [
    'fczuardi'
    ];

function buildAdminUI(){
    console.log('real buildAdminUI');
    var liSet = $('.photo-list li');
    liSet.each(function(index){
        var li = $(this),
            photoId = li.data('id'),
            username = li.data('username'),
            userBlacklisted = blacklistedUsers.indexOf(username) != -1,
            formHTML = ''+
'<form class="photo-form" action="photos/' +
    photoId + '" method="POST">' +
    '<p class="username">' +
        username +
        '<input type="checkbox" name="userBlacklisted"'+
        (userBlacklisted ? 'checked' : '') +
        '/>' +
    '</p>' +
    '<label>favorita <input type="checkbox" name="favorite"/></label>' +
    '<br /><input type="submit" value="salvar" />' +
'</form>';

        $(this).append(formHTML);
    });
    $('.photo-form').bind('submit',function(ev){
        // ev.preventDefault();
        console.log('form submitted');
    });
    return false;
}
