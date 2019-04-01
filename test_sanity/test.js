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

// functions
async function getOwner(contract) {
  return await contract.methods.owner().call();
}

// tests
describe(' Contracts', function() {

  var relayed;
  let RelayContractABI;

  async function initEverything(done) {
    let listening = await web3.eth.net.isListening();
    let jso = fs.readFileSync(VALUES, 'utf-8');
    values = JSON.parse(jso);
    let me = fs.readFileSync('../genome-system-contracts/build/contracts/' + CONTRACT + '.json', 'utf-8');
    RelayContractABI = JSON.parse(me);
  }

  before(async function (){
    await initEverything();
    relayed = new web3.eth.Contract(RelayContractABI.abi, values.address_book["VALIDATOR_RELAYED"]);
  });

  describe('Validator Relayed', function() {

    it('should be owned by NetOps', async function () {
      (await relayed.methods.owner.call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    });

    it('should set current list of validators correctly', async function () {
      let accounts = values.address_book["INITAL_VALIDATORS"];
      const validatorsList = [accounts[0], accounts[1], accounts[2]];
      let validators = await relayed.methods.getValidators.call();
      validators.should.be.deep.equal(validatorsList);
    });

  })

});
