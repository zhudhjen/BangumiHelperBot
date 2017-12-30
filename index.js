const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const axios = require('axios');
const token = require('./token');

const search_keywords = {
    book: {
        type: 'subject',
        cat: '1'
    },
    anime: {
        type: 'subject',
        cat: '2'
    },
    music: {
        type: 'subject',
        cat: '3'
    },
    game: {
        type: 'subject',
        cat: '4'
    },
    tv: {
        type: 'subject',
        cat: '5'
    },
    character: {
        type: 'mono',
        cat: 'crt'
    },
    person: {
        type: 'mono',
        cat: 'prsn'
    },
    start: {
        type: 'meta'
    },
    help: {
        type: 'meta'
    }
};

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

function sendMessage(id, text, res) {
    axios.post('https://api.telegram.org/bot' + token + '/sendMessage', {
        chat_id: id,
        text: text
    })
    .then(response => {
        console.log('Message sent');
        res.end('ok');
    })
    .catch(err => {
        console.log('Error: ', err);
        res.end('Error: ' + err);
    });
}

app.post('/', function(req, res) {
    console.log('Request received');

    const {message} = req.body;

    if (!message) {
        return res.end();
    }

    const {id} = message.chat;

    console.log(message.entities);

    let result = message.match(/^\/(\w+)\s*(.*)/);

    // input is not command
    if (!result) {
        return res.end();
    }

    let [ns, command, param] = result;

    console.log({
        command: command,
        param: param
    });

    if (!search_keywords.hasOwnProperty(command)) {
        console.log('Command not found');
        sendMessage(id, 'Command "' + command + '" not found', res);
        return;
    }

    let cmd_info = search_keywords[command];
    if (cmd_info.type === 'meta') {
        console.log('Meta command "' + command + '" not found');
        sendMessage(id, "Sorry, meta commands not implemented yet", res);
    } else {
        console.log('searching');
        axios.get('https://bgm.tv/' + cmd_info.type + '_search/' + param, {
            params: {
                'cat': cmd_info.cat
            },
            transformResponse: data => {
                console.log(data);
                return cheerio.load(data);
            }
        })
            .then($ => {
                let results = $('#columnSearchB').find('.light_odd');
                if (results.length === 0) {
                    sendMessage(id, 'Sorry, no such ' + command + ' "' + param + '" found');
                } else {
                    let entity = results[0];
                    console.log(entity);
                    let entity_name;
                    let name_tag = $('h2>a', entity);
                    if (name_tag.has('span')) {
                        entity_name = name_tag.text().slice(0, -4);
                    } else {
                        entity_name = name_tag.text().slice(0, -1);
                    }
                    sendMessage(id, entity_name, res);
                }
            })
            .catch(err => {
                console.log('Error: ' + err.message);
                sendMessage(id, 'Error: ' + err.message, res);
            });
        sendMessage(id, 'Sorry, meta commands not implemented yet', res);
    }

});

const port = 14200;
app.listen(port, function() {
    console.log('Bangumi Helper Bot listening on port ' + port);
});

