// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');
const utils = require('./utils')
var randomHex = require('randomhex');

const randomName = randomHex(32);
var name = "hallo1" + Math.random(1000000)
// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const VALUES = "./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json"
const ADDRESSES = JSON.parse(fs.readFileSync("./accounts/testaccounts.json", "utf-8"));
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
  describe("Registry one time tests", function() {
    this.timeout(120000);

    before("fund the multisig", async () => {
      const txData = {
        nonce: await web3.eth.getTransactionCount(ADDRESSES[2].address),
        gasLimit: 500000,
        gasPrice: 0,
        from: ADDRESSES[2].address,
        //to: values.address_book["VALIDATOR_NETOPS"],
        to: "0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b",
        value: web3.utils.toWei("2", "gwei")
      }

      const txObject = await web3.eth.accounts.signTransaction(txData, ADDRESSES[2].privateKey)
      await web3.eth.sendSignedTransaction((txObject).rawTransaction)
    })

    it("should reserve a name properly", async () => {

      const txA = {
        value: web3.utils.toWei("1", "gwei"),
        data: simpleReg.methods.reserve(randomName).encodeABI()
      };
      res1 = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      cowner = await simpleReg.methods.owner().call()

      //check if it worked
      res = await simpleReg.methods.entries(randomName).call()

      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"])
    })

    it("should setData properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.setData(randomName, "1234", randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.getData(randomName, "1234").call()
      assert.equal(res, randomName)
    })

    it("should proposeReserve properly", async () => {

      const txA = {
        value: web3.utils.toWei("1", "gwei"),
        data: simpleReg.methods.reserve(await web3.utils.sha3(name)).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      const txB = {
        value: '0',
        data: simpleReg.methods.proposeReverse(name, values.address_book["REGISTRY"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      //check if it worked
      res = await simpleReg.methods.getReverse(web3.utils.sha3(name)).call()
      assert.equal(res, values.address_book["REGISTRY"])
    })

    it("should confirmReserve properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.confirmReverse(name).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.getReverse(web3.utils.sha3(name)).call()
      assert.equal(res, values.address_book["REGISTRY"])
    })

    it("should removeReverse properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.removeReverse().encodeABI()
      };
      res = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
    })

    it("should drain properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.drain().encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await web3.eth.getBalance(values.address_book["REGISTRY"]);
      assert.equal(res, 0);
    })

    it("should transfer properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.reserve(randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      //check if it worked
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"]);

      const txB = {
        value: '0',
        data: simpleReg.methods.transfer(randomName, '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b').encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      //check if it worked
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner, '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b');

      await simpleReg.methods.transfer(randomName, values.address_book["VALIDATOR_NETOPS"]).send({
        from: '0x49B6e2386Bbf577c457B231bfd1D36bd8A916b4b',
        gasLimit: 50000
      });
      //check if it worked
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"]);
    })

    it("should drop properly", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.drop(randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      res = await simpleReg.methods.entries(randomName).call()
      assert.equal(res.deleted, true)
    })
  });
});