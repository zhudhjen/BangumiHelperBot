var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const axios = require('axios');
const token = require('./token');

app.user(bodyParser.json());
app.user(bodyParser.urlencoded({
    extended: true
}));

app.post('/new-message', function(req, res) {
    const {message} = req.body;

    if (!message || message.text.toLowerCase().indexOf('macro') < 0) {
        return res.end();
    }

    axios.post('https://api.telegram.org/' + token + '/sendMessage', {
        chat_id: message.chat.id,
        text: 'Poi~'
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

