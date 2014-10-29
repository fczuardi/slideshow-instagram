var fs = require('fs');

var Config = require('./config'),
    Instagram = require('instagram-node-lib'),
    Db = require('tingodb')({'searchInArray':true}).Db,
    mkdirp = require('mkdirp');

var photoEntriesUpdating = {};  //semaphores for checking when all photos for
                                //each tag have finished updating in the db

Instagram.set('client_id', Config.clientID);
Instagram.set('client_secret', Config.clientSecret);

//create data dir
mkdirp('www/data/db', function (err) {
    if (err) console.error(err);
});

//create db
var db = new Db('www/data/db', {}),
    collection = db.collection("photos");

function writeFeedForTag(tag){
    //querie visible photos for that tag
    collection.find(
        {'tags':tag},//query
        {'images':true,'link':true, 'user':true},//fields
        {'limit':20, 'sort':[['created_time','desc']]}//options
    ).toArray(
        function(err, results){//callback
            if (err) throw err;
            //write json file
            fs.writeFile(
                'www/data/response-' + tag + '.json',
                JSON.stringify(results, " ", 2), function (err) {
              if (err) throw err;
              console.log(tag + '.json '+ (new Date).toUTCString());
            });
        }
    );

}

//Call instagram tags.recent entrypoint for a tag
//and write the results on a json file.
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
                        item,//replacement object
                        {w:1, upsert:true},//options
                        function(err, result) {
                            if (err) throw err;
                            photoEntriesUpdating[tag] -= 1;
                            if (photoEntriesUpdating[tag] === 0){
                                //write json file for this tag
                                writeFeedForTag(tag);
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
