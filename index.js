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

    let result = message.text.match(/^\/(\w+)\s*(.*)/);

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
        let url ='http://bangumi.tv/' + cmd_info.type + '_search/' + param + '?cat=' + cmd_info.cat;
        console.log('searching: ' + url);

        axios.get(encodeURI(url), {
            headers: {
                Cookie: "chii_searchDateLine=0"
            }
        })
            .then(response => {
                const $ = cheerio.load(response.data);
                if (!$('#columnSearchB').length) {
                    // there is a typo in the original html code
                    if ($('#colunmNotice').length) {
                        sendMessage(id, 'Error: ' + $('p.text', '#colunmNotice').text(), res);
                    } else {
                        sendMessage(id, 'Error: search result not valid', res);
                    }
                    return;
                }
                if (cmd_info.type === 'subject') {
                    let items = $('#browserItemList').find('li.item');
                    if (items.length === 0) {
                        console.log('Entity not found');
                        sendMessage(id, 'Sorry, no such ' + command + ' "' + param + '" found');
                    } else {
                        console.log('Found entity');
                        let entity = items[0];
                        let entity_name = $('h3>a', entity).text();
                        console.log({
                            name: entity_name
                        });
                        sendMessage(id, entity_name, res);
                    }
                } else {
                    let items = $('#columnSearchB').find('.light_odd');
                    if (items.length === 0) {
                        console.log('Entity not found');
                        sendMessage(id, 'Sorry, no such ' + command + ' "' + param + '" found');
                    } else {
                        console.log('Found entity');
                        let entity = items[0];

                        let message, entity_name, entity_original_name, entity_info, entity_info_cleaned;

                        // find name
                        let name_tag = $('h2>a', entity);
                        console.log('Searching for the name');
                        if (name_tag.has('span')) {
                            entity_name = name_tag.clone().children().remove().end().text().slice(0, -4);
                            entity_original_name = $('span', name_tag).text();
                            message = entity_name + ' / ' + entity_original_name;
                        } else {
                            entity_name = name_tag.text().slice(0, -1);
                            message = entity_name;
                        }

                        // find info
                        let info_tag = $('div.prsn_info', entity);
                        if (info_tag.length !== 0) {
                            entity_info = info_tag.text().split('/');
                            entity_info_cleaned = [];
                            for (let i = 0; i < entity_info.length; i++) {
                                if (entity_info[i].trim() !== '') {
                                    entity_info_cleaned.push(entity_info[i].trim());
                                }
                            }
                            message += '\n\n' + entity_info_cleaned.join('\n');
                        }

                        console.log({
                            name: entity_name,
                            origin_name: entity_original_name,
                            info: entity_info_cleaned
                        });

                        sendMessage(id, message, res);
                    }
                }
            })
            .catch(err => {
                console.log('Error: ' + err.message);
                sendMessage(id, 'Error: ' + err.message, res);
            });
    }

});

const port = 14200;
app.listen(port, function() {
    console.log('Bangumi Helper Bot listening on port ' + port);
});

