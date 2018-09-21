'use strict';
var util = require('util');
var os = require('os');
var http = require('http');
var express = require('express');


// change the algo to sha1, sha256 etc according to your requirements
var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../public'))
app.get('/', function(req, res) {
  res.render('accueil.ejs', {tabl:tab});
});

app.listen(80);
