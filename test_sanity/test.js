// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis web3,eth,net,personal,parity,parity_set,traces,rpc,parity_accounts
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8450'));
const VALUES = "../ewf-genesis-generator/sample_chainspc/hardcoded_values.json"
const CONTRACT = "ValidatorSetRelayed"
var values = {};
var contract;

async function callAsync(contract) {
  contract.methods.getValidators().call((error, result) => {
  });
  
}

function initEverything(done) {
  web3.eth.net.isListening()
  .then(function() {
    console.log("Retrieving hard-coded addresses")
    fs.readFile(VALUES, (err, jso) => {  
      if (err) throw err;
      values = JSON.parse(jso);

      console.log("Retrieving contract ABI")
      fs.readFile('../genome-system-contracts/build/contracts/' + CONTRACT + '.json', (err, me) => {  
          if (err) throw err;
          let RelayContractABI = JSON.parse(me); 
          
          contract = web3.eth.Contract(RelayContractABI.abi, values.address_book["RELAYED_CONTRACT"])
          console.log(contract)
          done()

      });

    })     
  })
  .catch(e => console.log('Wow. Something went wrong.'));
}

describe('Validator Contracts', function() {

  before(initEverything)

  it('should resolve', (contract) => {
    return callAsync(contract);
  });
});
