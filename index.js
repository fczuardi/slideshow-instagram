var Config = require('./config');

console.log(Config);

Instagram = require('instagram-node-lib');

Instagram.set('client_id', Config.clientID);
Instagram.set('client_secret', Config.clientSecret);

//create data dir


Instagram.tags.info({
  name: Config.tags[1],
  complete: function(data){
    console.log(data);
  }
});


Instagram.tags.recent({
  name: Config.tags[1],
  complete: function(mediaObjects){
    mediaObjects.forEach(function(a, b){
        console.log(a.images.standard_resolution.url);
    });
    //save data to json to a file
    // console.log(JSON.stringify(data, " ", 2));
  }
});


//baixa a lista das últimas fotos com a tag x


//gera o index.html e copia para o diretorio





/*
GET /tags/tag-name/media/recent

Instagram.tags.recent({ name: 'blue' });
Subscriptions

Tag subscriptions are also available with the following methods. A callback_url is required if not specified globally, and you may also provide a verify_token if you want to keep track of which subscription is coming back. Note that while unsubscribe is identical to the generic subscriptions method below, here, unsubscribe_all only removes tag subscriptions.

Instagram.tags.subscribe({ object_id: 'blue' });
  ->  { object: 'tag',
        object_id: 'blue',
        aspect: 'media',
        callback_url: 'http://your.callback/path',
        type: 'subscription',
        id: '#' }

Instagram.tags.unsubscribe({ id: # });
  ->  null // null is success, an error is failure

Instagram.tags.unsubscribe_all();
  ->  null // null is success, an error is failure
*/
