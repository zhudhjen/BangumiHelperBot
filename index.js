var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
const axios = require('axios');
const token = require('./token');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/', function(req, res) {
    console.log('Request received');

    const {message} = req.body;

    if (!message) {
        return res.end();
    }

    console.log(message.entities);

    const re = /^\/(\w+)\s*(.*)/;
    let result = re.exec(message.text);

    if (!result) {
        return res.end();
    }

    let command = result[1];
    let param = result[2];

    console.log({
        'command': command,
        'param': param
    });

    const search_keywords = {
        'book': {
            'type': 'subject',
            'cat': '1'
        },
        'anime': {
            'type': 'subject',
            'cat': '2'
        },
        'music': {
            'type': 'subject',
            'cat': '3'
        },
        'game': {
            'type': 'subject',
            'cat': '4'
        },
    }
    if (command.match)

    axios.post('https://api.telegram.org/bot' + token + '/sendMessage', {
        chat_id: message.chat.id,
        text: 'Poi~' + param
    })
    .then(response => {
        console.log('Message sent');
        res.end('ok');
    })
    .catch(err => {
        console.log('Error: ', err);
        res.end('Error: ' + err);
    });
});

var port = 14200;
app.listen(port, function() {
    console.log('Bangumi Helper Bot listening on port ' + port);
});

