// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
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
  var netOpsMultiSig;
  var communityMultiSig;
  var holding;
  let RelayContractABI;
  let MultiSigABI;
  let holdingABI;

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();

    // retrieves the hardcoded values
    let jso = fs.readFileSync(VALUES, 'utf-8');
    values = JSON.parse(jso);

    // gets the ABI of all contracts    
    let me = fs.readFileSync('../genome-system-contracts/build/contracts/' + CONTRACT + '.json', 'utf-8');
    RelayContractABI = JSON.parse(me);
    me = fs.readFileSync('../genome-system-contracts/build/contracts/Holding.json', 'utf-8');
    holdingABI = JSON.parse(me);
    me = fs.readFileSync('../MultiSigWallet/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
  }

  before(async function (){
    await initEverything();
    // links the contracts
    relayed = new web3.eth.Contract(RelayContractABI.abi, values.address_book["VALIDATOR_RELAYED"]);
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);
    communityMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["COMMUNITY_FUND"]);
    holding = new web3.eth.Contract(holdingABI.abi, values.address_book["VESTING"]);
  });

  describe('Validator Relayed', function() {

    it('should be owned by NetOps', async function () {
      (await relayed.methods.owner.call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    });

    it('should set current list of validators correctly', async function () {
      let accounts = values.address_book["INITAL_VALIDATORS"];
      const validatorsList = [accounts[0], accounts[1], accounts[2]];
      var validators = await relayed.methods.getValidators.call();
      validators = validators.map(v => v.toLowerCase());
      validators.should.be.deep.equal(validatorsList);
    });
    // @TODO: other tests for validator relayed here
  });

  describe('NetOps MultiSigWallet', function() {

    it('should be owned by NetOps', async function () {
      let addresses = await communityMultiSig.methods.getOwners.call();
      addresses = addresses.map(v => v.toLowerCase());
      (await addresses).should.be.deep.equal(values.address_book["COMMUNITY_FUND_MEMBERS"]);
    });
    
  });

  describe('Community Fund MultiSigWallet', function() {

    it('should be owned by Community Fund', async function () {
      let addresses = await netOpsMultiSig.methods.getOwners.call();
      addresses = addresses.map(v => v.toLowerCase());
      (await addresses).should.be.deep.equal(values.address_book["NETOPS_MEMBERS"]);
    });
    
  });

  describe('Amount of tokens', function() {

    it('should sum to 80 M', async function() {
      let deployedHolding = values.address_book['VESTING'];
      let hardcodedHolding = values.balances["TARGET_AMOUNT"];
      (await web3.eth.getBalance(deployedHolding)).should.be.equal(hardcodedHolding);
    });

  })

});
