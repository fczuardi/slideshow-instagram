var Config = require('./cconfig');

console.log(Config);

Instagram = require('instagram-node-lib');

Instagram.set('client_id', Config.clientID);
Instagram.set('client_secret', Config.clientSecret);


//baixa a lista das últimas fotos com a tag x

//gera o index.html e copia para o diretorio













Instagram.tags.info({
  name: Config.tags[1],
  complete: function(data){
    console.log(data);
  }
});
