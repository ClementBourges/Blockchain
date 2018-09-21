'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var http = require('http');
var https = require('https');
var crypto = require('crypto');


var fs = require('fs');

var cledispo=0;
//
var fabric_client = new Fabric_Client();

// setup the fabric network


var bodyParser = require('body-parser');
var express = require('express');
const fileUpload = require('express-fileupload');

var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
var chaine='';
var lock=0;


var channel = fabric_client.newChannel('mychannel');

let peer = fabric_client.newPeer('grpc://localhost:9051');
channel.addPeer(peer);
let orderer = fabric_client.newOrderer('grpc://localhost:7050');
channel.addOrderer(orderer);


var member_user = null;
var store_path = "./hfc-key-store"
var tx_id = null;

//-------------------------BLOCKCHAIN---------------------------------------
app.use(express.static('../public'))
app.get('/', function(req, res) {



        // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
        Fabric_Client.newDefaultKeyValueStore({ path: store_path
        }).then((state_store) => {
                // assign the store to the fabric client
                fabric_client.setStateStore(state_store);
                var crypto_suite = Fabric_Client.newCryptoSuite();
                // use the same location for the state store (where the users' certificate are kept)
                // and the crypto store (where the users' keys are kept)
                var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
                crypto_suite.setCryptoKeyStore(crypto_store);
                fabric_client.setCryptoSuite(crypto_suite);

                // get the enrolled user from persistence, this user will sign all requests
                return fabric_client.getUserContext('user2', true);
        }).then((user_from_store) => {
                if (user_from_store && user_from_store.isEnrolled()) {
                        member_user = user_from_store;
                } else {
                        throw new Error('Failed to get user2.... run registerUser.js');
                }

                // queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
                // queryAllCars chaincode function - requires no arguments , ex: args: [''],
                const request = {
                        //targets : --- letting this default to the peers assigned to the channel
                        chaincodeId: 'formation',
                        fcn: 'queryAllFormations',
                        args: ['']
                };
                // send the query proposal to the peer
                return channel.queryByChaincode(request);
        }).then((query_responses) => {
                // query_responses could have more than one  results if there multiple peers were used as targets
                if (query_responses && query_responses.length == 1) {
                        if (query_responses[0] instanceof Error) {
                                console.error("error from query = ", query_responses[0]);
                        } else {
                                  var tab=JSON.parse(query_responses[0].toString());
                                  var i=0;
                                  var trouve=false;
                                  while(trouve!=true && i <999)
                                  {
                                    i++;
                                    var k=0;
                                    var bool=0
                                    while(k<999 && bool==0)
                                    {
                                      var cle='FOR'+i.toString()
                                      if(typeof tab[k] !='undefined' && cle==tab[k].Key)
                                      {
                                        bool=1;
                                      }
                                      k++;

                                    }

                                    if (k==999)
                                    {
                                        trouve=true;
                                    }
                                  }
                                  cledispo=i;
                                  res.render('accueil.ejs', {tabl:tab});

                        }
                } else {
                        console.log("No payloads were returned from query");
                }
        }).catch((err) => {
                console.error('Failed to query successfully :: ' + err);
        });
});



app.get('/ajouter', function(req, res) {
    res.render('ajouter.ejs');
});

app.use(fileUpload());

app.post('/formulaire', (req, res) => {
  if (!req.files)
    return res.status(400).send('No files were uploaded.');

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('../public/feuilles/'+'FOR'+ cledispo.toString()+'.jpg', function(err) {
    if (err)
      return res.status(500).send(err);
  });
  console.log("req.files:"+req.files)
  console.log(sampleFile.data)
  var algo = 'sha256';
  var hash= crypto.createHash(algo).update(sampleFile.data).digest('hex');
  console.log(hash);
  var formation = {
    ident: req.body.ident,
    description: req.body.description,
    date: req.body.date,
    formateur: req.body.formateur,
    volume: req.body.volume,
    fichier: hash,
    signature: "\u26A0"
  };



  //
  var member_user = null;
  var tx_id = null;

  // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
  Fabric_Client.newDefaultKeyValueStore({ path: store_path
  }).then((state_store) => {
  	// assign the store to the fabric client
  	fabric_client.setStateStore(state_store);
  	var crypto_suite = Fabric_Client.newCryptoSuite();
  	// use the same location for the state store (where the users' certificate are kept)
  	// and the crypto store (where the users' keys are kept)
  	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
  	crypto_suite.setCryptoKeyStore(crypto_store);
  	fabric_client.setCryptoSuite(crypto_suite);

  	// get the enrolled user from persistence, this user will sign all requests
  	return fabric_client.getUserContext('user2', true);
  }).then((user_from_store) => {
  	if (user_from_store && user_from_store.isEnrolled()) {
  		member_user = user_from_store;
  	} else {
  		throw new Error('Failed to get user2.... run registerUser.js');
  	}

  	// get a transaction id object based on the current user assigned to fabric client
  	tx_id = fabric_client.newTransactionID();
  	// createCar chaincode function - requires 5 args, ex: args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
  	// changeCarOwner chaincode function - requires 2 args , ex: args: ['CAR10', 'Dave'],
  	// must send the proposal to endorsing peers
    var clee='FOR'+ cledispo.toString()
    console.log("On rajoute la formation:" + clee)
  	var request = {
  		//targets: let default to the peer assigned to the client
  		chaincodeId: 'formation',
  		fcn: 'createFormation',
  		args: [clee,formation.ident, formation.description, formation.date,formation.formateur,formation.volume,formation.fichier],
  		chainId: 'mychannel',
  		txId: tx_id
  	};

  	// send the transaction proposal to the peers
  	return channel.sendTransactionProposal(request);
  }).then((results) => {
  	var proposalResponses = results[0];
  	var proposal = results[1];
  	let isProposalGood = false;
  	if (proposalResponses && proposalResponses[0].response &&
  		proposalResponses[0].response.status === 200) {
  			isProposalGood = true;
  		} else {
  			console.error('Transaction proposal was bad');
  		}
  	if (isProposalGood) {

  		// build up the request for the orderer to have the transaction committed
  		var request = {
  			proposalResponses: proposalResponses,
  			proposal: proposal
  		};

  		// set the transaction listener and set a timeout of 30 sec
  		// if the transaction did not get committed within the timeout period,
  		// report a TIMEOUT status
  		var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
  		var promises = [];

  		var sendPromise = channel.sendTransaction(request);
  		promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

  		// get an eventhub once the fabric client has a user assigned. The user
  		// is required bacause the event registration must be signed
  		let event_hub = fabric_client.newEventHub();
  		//event_hub.setPeerAddr('grpc://localhost:7053');
      event_hub.setPeerAddr('grpc://localhost:9053');

  		// using resolve the promise so that result status may be processed
  		// under the then clause rather than having the catch clause process
  		// the status
  		let txPromise = new Promise((resolve, reject) => {
  			let handle = setTimeout(() => {
  				event_hub.disconnect();
  				resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
  			}, 3000);
  			event_hub.connect();
  			event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
  				// this is the callback for transaction event status
  				// first some clean up of event listener
  				clearTimeout(handle);
  				event_hub.unregisterTxEvent(transaction_id_string);
  				event_hub.disconnect();

  				// now let the application know what happened
  				var return_status = {event_status : code, tx_id : transaction_id_string};
  				if (code !== 'VALID') {
  					console.error('The transaction was invalid, code = ' + code);
  					resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
  				} else {
  					resolve(return_status);
  				}
  			}, (err) => {
  				//this is the callback if something goes wrong with the event registration or processing
  				reject(new Error('There was a problem with the eventhub ::'+err));
  			});
  		});
  		promises.push(txPromise);

  		return Promise.all(promises);
  	} else {
  		console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
  		throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
  	}
  }).then((results) => {
  	// check the results in the order the promises were added to the promise all list
  	if (results && results[0] && results[0].status === 'SUCCESS') {
  	} else {
  		console.error('Failed to order the transaction. Error code: ' + results[0].status);
  	}

  	if(results && results[1] && results[1].event_status === 'VALID') {
  	} else {
  		console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
  	}
  }).catch((err) => {
  	console.error('Failed to invoke successfully :: ' + err);
  });
  res.redirect('/');
});

app.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});

app.listen(8082);
