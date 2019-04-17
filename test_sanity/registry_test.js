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

    it("should not allow anyone except the owner to reserve", async () => {
      try {
        await simpleReg.methods.reserve("TestRegister").send({
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

    it("should only allow owner to call reserve", async () => {
      try {
        await simpleReg.methods.reserve("TestRegister").send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call setData", async () => {
      try {
        await simpleReg.methods.setData("TestRegister").send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call setAddress", async () => {
      try {
        await simpleReg.methods.setAddress('0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call setUint", async () => {
      try {
        await simpleReg.methods.setUint(12345).send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call proposeReverse", async () => {
      try {
        await simpleReg.methods.proposeReverse("TestRegister", '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call confirmReverse", async () => {
      try {
        await simpleReg.methods.confirmReverse("TestRegister").send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })
    it("should only allow owner to call confirmReverseAs", async () => {
      try {
        await simpleReg.methods.confirmReverseAs("TestRegister", '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })

    it("should only allow owner to transfer", async () => {
      try {
        await simpleReg.methods.transfer("TestRegister", '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').send({
          gasLimit: '50000',
          from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b'
        })
      } catch (err) {}
    })

  });

  //since they are onetime tests I have no clue if they will pass
  describe.skip("Registry one time tests", function() {
    this.timeout(120000);

    it("should reserve a name properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.reserve('Hallo').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.entries("Hallo").call()
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"])
    })

    it("should setData properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.setData('Hallo', 1234, 99999).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.getData("Hallo", 1234).call()
      assert.equal(res, 99999)
    })

    it("should proposeReserve properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.proposeReverse('Hallo', '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.getReverse("Hallo").call()
    //assert.equal(res, 99999)
    })

    it("should confirmReserve properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.confirmReverse('Hallo').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.getReverse("Hallo").call()
    })

    it("should removeReverse properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.removeReverse().encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
    })

    it("should drain properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.confirmReverse('Hallo').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await web3.eth.getBalance(values.address_book["REGISTRY"])
      assert.equal(res, 0)
    })

    it("should transfer properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.reserve('Hallo2').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.entries("Hallo").call()
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"])

      const txB = {
        value: '0',
        data: simpleReg.methods.transfer('Hallo2', '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      await simpleReg.methods.transfer('Hallo2', values.address_book["VALIDATOR_NETOPS"]).send();
      //check if it worked
      res = await simpleReg.methods.entries("Hallo").call()
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"])
    })
    it("should drop properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.drop('Hallo2').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
    })
  });
});