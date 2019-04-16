// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');
const utils = require('./utils')

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
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

    it("should have the owner set correctly", async () => {
      owner = await simpleReg.methods.owner().call();
      assert.equal(owner, values.address_book["VALIDATOR_NETOPS"])
    })

    it("should not allow anyone except the owner to register", async () => {
      try {
        await simpleReg.methods.register("TestRegister").send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })

    it("should allow the contract owner to set the registration fee", async () => {
      //needs to fail
      try {
        await simpleReg.methods.setFee(10).send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        });
      } catch (err) {}

      const txA = {
        value: '0',
        data: simpleReg.methods.setFee(10).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      fee = await simpleReg.methods.fee().call();

      assert.equal(fee.toString(), 10);

      const txB = {
        value: '0',
        data: simpleReg.methods.setFee(33).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      fee = await simpleReg.methods.fee().call();

      assert.equal(fee.toString(), 33);
    });

    it("should set a new owner", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.transferOwnership('0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      txReturn = await simpleReg.methods.owner().call()
      assert.equal(txReturn, '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b')
      await simpleReg.methods.transferOwnership(values.address_book["VALIDATOR_NETOPS"]).send({
        gasLimit: 50000,
        from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
      })

      const txB = {
        value: '0',
        data: simpleReg.methods.transferOwnership(values.address_book["VALIDATOR_NETOPS"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      txReturn = await simpleReg.methods.owner().call()
      assert.equal(txReturn, values.address_book["VALIDATOR_NETOPS"])
    });

  });

});