// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');
const utils = require('./utils')
const csv = require('csv-parser')

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const VALUES = "./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json"
var values = {};
const results = [];
var accounts;

// tests
describe(' Contracts', function() {

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
    me = fs.readFileSync('./node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
    utils.addTestWallets(web3);
  }

  before(async function () {
    this.timeout(60000);
    await initEverything();
    // links the contracts
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);
  });

  describe('MultiSig', function() {
    this.timeout(120000);

    ///@dev needs to be adapted to the actual list format
    it("should have set all multisig owners correctly", async () => {
      var result = await new Promise((resolve, reject) => {
        fs.createReadStream('./test_sanity/multisig.csv')
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            resolve(results)
          });
      });

      const ownerArray = await netOpsMultiSig.methods.getOwners().call()

      for (i = 0; i < result.length; i++) {
        assert(ownerArray.includes(result[i].address))
      }
    })
  });
});
