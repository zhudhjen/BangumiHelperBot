var express = require('express');
var app = express();
var bodyParser = require('body-parser');
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

    axios.post('https://api.telegram.org/bot' + token + '/sendMessage', {
        chat_id: message.chat.id,
        text: 'Poi~'
    })
    .then(response => {
        console.log('Message sent');
        res.end('ok');
    })
    .catch(err => {
        console.log('Error: ', err);
        // console.log('Error');
        res.end('Error: ' + err);
    });
});

var port = 14200;
app.listen(port, function() {
    console.log('Bangumi Helper Bot listening on port ' + port);
});

