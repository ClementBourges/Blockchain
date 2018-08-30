#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
#On fait place nette
#/home/clem/fabric-samples/first-network/byfn.sh down
docker rm -f $(docker ps -aq)
docker network prune
docker rmi dev-peer0.org1.example.com-formation-1.0-82548e983bd6d6bb0272bc7140fd3723fa648dc3e92815b675512866407cab99
#sudo cp -r ../basic-network/crypto-config .
# Exit on first error
set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
LANGUAGE=${1:-"golang"}
CC_SRC_PATH=github.com/formation/go
if [ "$LANGUAGE" = "node" -o "$LANGUAGE" = "NODE" ]; then
	CC_SRC_PATH=/opt/gopath/src/github.com/formation/node
fi

export COMPOSE_PROJECT_NAME=formation


# clean the keystore
rm -rf ./blockchain/hfc-key-store

# launch network; create channel and join peer to channel
# Exit on first error, print all commands.
set -ev

docker-compose -f ./blockchain/docker-compose.yml down

docker-compose -f ./blockchain/docker-compose.yml up -d ca.example.com orderer.example.com peer0.org1.example.com couchdb

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=5
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel create -o orderer.example.com:7050 -c mychannel -f /etc/hyperledger/configtx/channel.tx
# Join peer0.org1.example.com to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer0.org1.example.com peer channel join -b mychannel.block


# Now launch the CLI container in order to install, instantiate chaincode
# and prime the ledger with our 10 cars
docker-compose -f ./blockchain/docker-compose.yml up -d cli

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n formation -v 1.0 -p "$CC_SRC_PATH" -l "$LANGUAGE"
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n formation -l "$LANGUAGE" -v 1.0 -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
sleep 5
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n formation -c '{"function":"initLedger","Args":[""]}'

printf "\nTotal setup execution time : $(($(date +%s) - starttime)) secs ...\n\n\n"
printf "Start by installing required packages run 'npm install'\n"
printf "Then run 'node enrollAdmin.js', then 'node registerUser'\n\n"
printf "The 'node invoke.js' will fail until it has been updated with valid arguments\n"
printf "The 'node query.js' may be run at anytime once the user has been registered\n\n"

sudo node ./blockchain/enrollAdmin.js
sudo node ./blockchain/registerUser.js
