var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const axios = require('axios');
const token = require('./token');

app.user(bodyParser.json());
app.user(bodyParser.urlencoded({
    extended: true
}));




