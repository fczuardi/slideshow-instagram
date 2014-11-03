var APPCACHE_FILE = 'www/v1.1.0.appcache';
var fs = require('fs');

var Config = require('./config'),
    Instagram = require('instagram-node-lib'),
    Db = require('tingodb')({'searchInArray':true}).Db,
    mkdirp = require('mkdirp'),
    express = require('express'),
    auth = require('basic-auth'),
    bodyParser = require('body-parser');

var blockedUsers = [],
    photoEntriesUpdating = {};  //semaphores for checking when all photos for
                                //each tag have finished updating in the db

// Database setup
//----------------------------------------------------------------------------
//create data dir
mkdirp('www/data/db', function (err) {
    if (err) console.error(err);
});

//create db
var db = new Db('www/data/db', {}),
    collection = db.collection("photos"),
    userCollection = db.collection("users");

// collection.remove({'tags':'blue'}, {w:1}, function(err, numberOfRemovedDocs) {
//     console.log('removed ',numberOfRemovedDocs);
// });

// Admin web interface
//----------------------------------------------------------------------------
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    var credentials = auth(req)
    if (!credentials ||
            credentials.name !== Config.adminUser ||
            credentials.pass !== Config.adminPassword) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="admin"');
        res.end('Unauthorized');
    } else {
        next();
    }
});
app.use('/www', express.static(__dirname + '/www'));
app.use('/admin', express.static(__dirname + '/admin-www'));

app.get('/', function(req, res) {
    res.send('Index');
});

app.post('/api/photos/:id', function (req, res, next) {
    var favorite = (req.body.favorite != 'on') ? 'off' : 'on',
        hide = (req.body.hide != 'on') ? 'off' : 'on',
        tag = req.body.tag,
        userId = req.body.userId,
        userBlacklisted = (req.body.userBlacklisted == 'on'),
        photoId = req.params.id,
        output = '';
    //upsert photo on DB
    collection.findAndModify(
        {id: photoId},//query
        [['_id','asc']],//sort order
        {$set:{
                'slideshow_favorite':favorite,
                'slideshow_hide':hide
            }
        },//fields to update
        {w:1, new:true},
        function(err, result) {
            var replacement = userBlacklisted ?
                            {id: userId, $addToSet: { 'blocked_tags': tag}} :
                            {id: userId, $pull: { 'blocked_tags': tag}};
            if (err) throw err;
            output += "photo updated:\n"+JSON.stringify(result, ' ', 2);
            //updated user blacklist for that tag
            userCollection.findAndModify(
                {'id': userId},//query
                [['id','asc']],//sort order
                replacement,//replacement object
                {w:1, upsert:true, new:true},//options
                function(err, result) {
                    if (err) throw err;
                    output += "\n\nblacklist updated:\n"+
                                JSON.stringify(result);
                    updateBlockedUsersAndFeeds(tag);
                    res.send('<p><a href="/admin">voltar</a></p><pre>' +
                                output +
                                '</pre><p><a href="/admin">voltar</a></p>'
                            );
                }
            );
        }
    );
});

app.listen(Config.adminPort)


// Photo feeds creation / periodic updates
//----------------------------------------------------------------------------
Instagram.set('client_id', Config.clientID);
Instagram.set('client_secret', Config.clientSecret);

function getBlockedUsers(tag, cb){
    userCollection.find(
        {'blocked_tags':tag},//query
        {id:true}//fields
    ).toArray(
        function(err, results){
            if (err) throw err;
            blockedUsers = [];
            results.forEach(function(item){
                blockedUsers.push(item.id);
            });
            cb(tag);
        }
    );
}

function updateBlockedUsersAndFeeds(tag){
    var blacklistfilename = 'www/data/blacklist-'+ tag +'.json';
    getBlockedUsers(tag, function(){
        fs.writeFile(
            blacklistfilename,
            JSON.stringify(blockedUsers, " ", 2),
            function (err) {
                if (err) throw err;
                console.log(blacklistfilename + ' updated at '+
                                        (new Date).toUTCString());
        });
        writeFeedForTag(tag);
        writeFeedForTag(tag, true);
    });
}

function updateAppCacheFile(){
    var contents = fs.readFileSync(APPCACHE_FILE, "utf8");
    contents = contents.replace(
        /# updated_time: (.*)/,
        '# updated_time: '+(new Date).toUTCString());

    fs.writeFile(
        APPCACHE_FILE,
        contents, function (err) {
            if (err) throw err;
            console.log(APPCACHE_FILE + ' updated');
    });
}

function writeFeedForTag(tag, admin){
    var queryAdmin = {
        'tags': tag,
        },
        queryUser = {
            'tags': tag,
            'slideshow_hide': {$ne: 'on'},
            'user.id': {$nin:blockedUsers}
        },
        fieldsUser = {
            'id':true,
            'images':true,
            'link':true,
            'user':true,
        },
        fieldsAdmin = {
            'id':true,
            'images':true,
            'link':true,
            'user':true,
            'slideshow_favorite':true,
            'slideshow_hide':true
        },
        // orderBy = {} $orderby: { age : -1 }
        filenameAdmin = 'www/data/response-' + tag + '-admin.json',
        filenameUser = 'www/data/response-' + tag + '.json',
        isAdmin = admin !== undefined,
        query = isAdmin ? queryAdmin : queryUser,
        fields = isAdmin ? fieldsAdmin : fieldsUser,
        filename = isAdmin ? filenameAdmin : filenameUser,
        filenameParts = filename.split('.'),
        firstPageName = filenameParts[0] +
                            '-page-0' +
                            '.' + filenameParts[1],
        limit = (isAdmin ? 100 : 30),
        queryLimit = 200,
        latestVersion = [];
    //if writing the user feed, get the contents to check if it changed
    if (isAdmin){
        try{
            latestVersion = JSON.parse(
                fs.readFileSync(firstPageName, "utf8")
            );
        }catch(e){
            console.log(e);
            latestVersion = [];
        }
    }
    //querie visible photos for that tag
    collection.find(
        query,
        fields,
        {'limit':queryLimit, 'sort':[['created_time','desc']]}//options
    ).toArray(
        function(err, results){//callback
            if (err) throw err;
            var haveChanged = false;
            if (!isAdmin){
                for (var index=0; index < results.length; index++){
                    try{
                        var item = latestVersion[index];
                        if (results[index].id != item.id){
                            haveChanged = true;
                            break;
                        }
                    }catch(e){
                        haveChanged = true;
                    }
                }
                // compare old with new
                console.log('have '+ firstPageName +
                                ' changed? ', haveChanged);
                if (haveChanged){
                    updateAppCacheFile();
                }
            }
            if (isAdmin || haveChanged){
                var numPages = Math.ceil(results.length / limit);
                for (var p=0; p < numPages; p++){
                    var list = results.slice(p*limit, (p+1)*limit),
                        paginatedFilename = filenameParts[0] +
                                            '-page-' + p +
                                            '.' + filenameParts[1],
                        newFileContents = '';
                    if (list.length == limit){
                        list[limit-1].nextFeed = filenameParts[0] +
                                                    '-page-' + (p+1) +
                                                    '.' + filenameParts[1];
                    }
                    newFileContents = JSON.stringify(list, " ", 2);
                    //write json file
                    console.log('writing '+ paginatedFilename +
                                (new Date).toUTCString() +
                                ' photos:' + list.length);
                    fs.writeFile(
                        paginatedFilename,
                        newFileContents, function (err) {
                            if (err) throw err;
                        }
                    );
                }
            }
        }
    );
}

//Call instagram tags.recent entrypoint for a tag
//and write the results on a database.
//
//If the tag parameter has colons in it, such as blue:1414375200075
//the value after the first colon will be treated as a timestamp to hide
//pictures created before it.
function updateTagJSON(tag){
    var tagParts = tag.split(':'),
        tag = tagParts[0],
        createdAfter = tagParts[1],
        callParameters = {
          name: tag,
          complete: function (mediaObjects){
                createdAfter = (createdAfter == undefined) ? 0 : createdAfter;
                photoEntriesUpdating[tag] = mediaObjects.length;
                mediaObjects.forEach(function(item){
                    if (item.created_time < createdAfter){
                        photoEntriesUpdating[tag] -= 1;
                        return;
                    }
                    //upsert photo on DB
                    collection.findAndModify(
                        {id: item.id},//query
                        [['created_time','asc']],//sort order
                        {$set:item},//replacement object
                        {w:1, upsert:true},//options
                        function(err, result) {
                            if (err) throw err;
                            photoEntriesUpdating[tag] -= 1;
                            if (photoEntriesUpdating[tag] === 0){
                                //write json file for this tag
                                updateBlockedUsersAndFeeds(tag);
                            }
                        }
                    );
                });
          }
        };
    Instagram.tags.recent(callParameters);
}

function startPolling(){
    Config.tags.forEach(function (tag){
        updateTagJSON(tag);
    });

    //Re-fetch the api feeds for the tags every minute
    var interval = setInterval(function(){
        console.log('-----');
        Config.tags.forEach(function (tag){
            updateTagJSON(tag);
        });
    }, 1000 * 60 * 1);
}

startPolling();
