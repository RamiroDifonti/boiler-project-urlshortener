require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// dns.lookup
const dns = require('dns');

// bodyParser
const bodyParser = require('body-parser');

// data
const fs = require('fs');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Middleware necesario para leer el req.body
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

function data_management(url, action) {
  if (action == "add data") {
    let file = fs.readFileSync('./public/data.json');
    // Convertir la cadena JSON a un objeto JavaScript
    let data = JSON.parse(file.toString());
    for (let i = 0; i < data.length; ++i) {
      if (url == data[i]["original_url"]) {
        return data[i];
      }
    }
    original_url = url;
    short_url = data.length + 1;

    // Guardar el json modificado
    shortener_data = {original_url: original_url, short_url: short_url};
    data.push(shortener_data);
    fs.writeFileSync('./public/data.json', JSON.stringify(data, null, 2));
    return shortener_data;
  } else if (action == "read short") {
    let file = fs.readFileSync('./public/data.json');
    // Convertir la cadena JSON a un objeto JavaScript
    let data = JSON.parse(file.toString());
    for (let i = 0; i < data.length; ++i) {
      if (url == data[i]["short_url"]) {
        return data[i]["original_url"];
      }
    }
    // No existe un original_url para ese short_url
    return "";
  }
};
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  // Recibir la url enviada
  url_input = req.body.url;
  // Comprobar si empieza por https:// o http://
  http_valid = /^http(s|):\/\/.+$/.test(url_input);
  if (!http_valid) {
    return res.send({error: 'invalid url'});
  }

  // expresion regular para obtener el dominio
  dominio = url_input.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm).toString();
  // Separar la cadena y quedarse con el resto a partir del ://
  test_dns = dominio.split('://')[1];
  
  // comprobar si la pagina web devuelve informacion (existe), sino, mostrar un error
  dns.lookup(test_dns, (err, address) => {
    if (err) {
      console.log(address);
      return res.json({error: 'invalid url'});
    } else {
      let test_data = data_management(url_input, "add data");
      return res.send(test_data);
    }
  });
});

app.get('/api/shorturl/:shorturl', function(req, res) {
  let input = req.params.shorturl;
  let url = data_management(input, "read short");
  if (url != "") {
    // redireccionar a la otra pagina
    res.redirect(url);
  } else {
    res.json({data: "No url found", short_url: input});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
