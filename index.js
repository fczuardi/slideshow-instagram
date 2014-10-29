var Config = require('./config'),
    Instagram = require('instagram-node-lib'),
    fs = require('fs'),
    mkdirp = require('mkdirp');


Instagram.set('client_id', Config.clientID);
Instagram.set('client_secret', Config.clientSecret);

//create data dir
mkdirp('www/data', function (err) {
    if (err) console.error(err)
    else console.log('data dir created');
});

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
              var visibleObjects = [];
              createdAfter = (createdAfter == undefined) ? 0 : createdAfter;
              mediaObjects.forEach(function(item){
                  if (item.created_time > createdAfter){
                      visibleObjects.push(item);
                  }
              });
              fs.writeFile(
                  'www/data/response-' + tag + '.json',
                  JSON.stringify(visibleObjects, " ", 2), function (err) {
                if (err) throw err;
                console.log(
                    tag + '.json '+
                    (new Date).toUTCString() + ' '+
                    createdAfter
                );
              });
          }
        };
    Instagram.tags.recent(callParameters);
}

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
