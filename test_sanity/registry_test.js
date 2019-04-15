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

  let registry;
  let RegistryABI;

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
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/SimpleRegistry.json', 'utf-8');
    RegistryABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
    utils.addTestWallets(web3);
  }

  before(async function () {
    this.timeout(60000);
    await initEverything();
    // links the contracts
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);
    simpleReg = new web3.eth.Contract(RegistryABI.abi, values.address_book["REGISTRY"]);
  });

  describe('Registry', function() {
    this.timeout(120000);

    it("should have the owner set correctly")

    it("should not allow anyone except the owner to register")

    it("should allow the contract owner to set the registration fee", async () => {
      //needs to fail
      await simpleReg.methods.setFee(10).send({
        from: accounts[1]
      })
      const txA = {
        value: '0',
        data: impleReg.methods.setFee(10).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      const fee = await simpleReg.methods.fee().call();

      assert.equal(fee, 10);
    });

    it("should set a new owner", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.transferOwnership(accounts[1]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      txReturn = simpleReg.methods.owner().call()
      console.log(txReturn)

      const txB = {
        value: '0',
        data: simpleReg.methods.transferOwnership(values.address_book["VALIDATOR_NETOPS"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

    });

  });

});