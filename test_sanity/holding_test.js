// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');
const utils = require('./utils')

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
const VALUES = "./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json"
var values = {};
var accounts;

// tests
describe(' Contracts', function() {

  let holding;
  let HoldingABI;

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();
    web3.transactionConfirmationBlocks = 1;
    web3.eth.transactionConfirmationBlocks = 1;

    // retrieves the hardcoded values
    let jso = fs.readFileSync(VALUES, 'utf-8');
    values = JSON.parse(jso);
    accounts = values.address_book["INITAL_VALIDATORS"];

    // gets the ABI of all contracts    
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/Holding.json', 'utf-8');
    HoldingABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
    utils.addTestWallets(web3);
  }

  before(async function () {
    this.timeout(60000);
    await initEverything();
    // links the contracts
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);
    holding = new web3.eth.Contract(HoldingABI.abi, values.address_book["VESTING"]);
  });

  describe('Holding', function() {
    this.timeout(120000);

    it("should have set all vestings correctly")

  });
});