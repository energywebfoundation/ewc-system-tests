// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');

var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8450'));
const VALUES = "hardcoded_values.json"
const CONTRACT = "ValidatorSetRelayed"
var values = {};

async function callAsync() {
  // async stuff
}

async function linkContract(web3, ) {
  return new web3.eth.Contract(res, values.address_book["RELAYED_CONTRACT"]);  
}

const tasks = [
  function() {
    console.log("in here")
    return web3.eth.net.isListening()
  },
  function retrieveValues() {
    // retrieves hardcoded values
    fs.readFile(VALUES, (err, jso) => {  
      if (err) throw err;
      values = JSON.parse(jso);
      console.log(values)
      return values
    })
  },
  function retrieveABI(values) {
    // retrieves contract ABI
    var RelayContractABI;
    fs.readFile('../genome-system-contracts/build/contracts/' + CONTRACT + '.json', (err, me) => {  
        if (err) throw err;
        RelayContractABI = JSON.parse(me);  
        const data = {
          abi: RelayContractABI.abi,
          values: values
        }
        console.log(data)
        return data
    });
  }

]

async.waterfall(tasks, (err, results) => {
  if (err) {
      return next(err);
  }
  return res.json(results);
})

/** 

describe('Validator Contracts', function() {

  var values = {};
  var contract;

  before(function(values) {

  })

  it('should resolve', () => {
    return callAsync();
  });
});

*/
