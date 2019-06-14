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
const ADDRESSES = JSON.parse(fs.readFileSync("./accounts/testaccounts.json", "utf-8"));
var values = {};
var accounts;

const {
    ChainspecValues,
    MultiSigWalletJSON,
    RegistryJSON,
    DEFAULT_ADDRESS
} = require(__dirname + "/utils.js");

// tests
describe('Registry', function() {

  let RegistryABI;

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();
    web3.transactionConfirmationBlocks = 1;
    web3.eth.transactionConfirmationBlocks = 1;

    // retrieves the hardcoded values
    values = ChainspecValues;
    accounts = values.address_book["INITAL_VALIDATORS"];

    // gets the ABI of all contracts    
    RegistryABI = RegistryJSON;
    MultiSigABI = MultiSigWalletJSON;
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
    this.timeout(150000);
    

    it("should have the owner set correctly", async () => {
      owner = await simpleReg.methods.owner().call();
      assert.equal(owner, values.address_book["VALIDATOR_NETOPS"])
    })

    it("should not allow anyone except the owner to reserve", async () => {
      try {
        await simpleReg.methods.reserve("TestRegister").send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false)
      } catch (err) {
        assert(true)
      }
    });

    it("should set a new owner", async () => {
      const txA = {
        value: '0',
        data: simpleReg.methods.transferOwnership(ADDRESSES[1].address).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      txReturn = await simpleReg.methods.owner().call()
      assert.equal(txReturn.toLowerCase(), ADDRESSES[1].address.toLowerCase())
      await simpleReg.methods.transferOwnership(values.address_book["VALIDATOR_NETOPS"]).send({
        gasLimit: 500000,
        from: ADDRESSES[1].address
      })

      const txB = {
        value: '0',
        data: simpleReg.methods.transferOwnership(values.address_book["VALIDATOR_NETOPS"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      txReturn = await simpleReg.methods.owner().call()
      assert.equal(txReturn.toLowerCase(), values.address_book["VALIDATOR_NETOPS"].toLowerCase())
    });

    it("should only allow owner to call reserve", async () => {
      try {
        await simpleReg.methods.reserve("TestRegister").send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call setData", async () => {
      try {
        await simpleReg.methods.setData("TestRegister").send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call setAddress", async () => {
      try {
        await simpleReg.methods.setAddress(ADDRESSES[1].address).send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        })
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call setUint", async () => {
      try {
        await simpleReg.methods.setUint(12345).send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call proposeReverse", async () => {
      try {
        await simpleReg.methods.proposeReverse("TestRegister", ADDRESSES[1].address).send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call confirmReverse", async () => {
      try {
        await simpleReg.methods.confirmReverse("TestRegister").send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
    it("should only allow owner to call confirmReverseAs", async () => {
      try {
        await simpleReg.methods.confirmReverseAs("TestRegister", ADDRESSES[1].address).send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        });
        assert(false);
      } catch (err) {
        assert(true);
      }
    })

    it("should only allow owner to transfer", async () => {
      try {
        await simpleReg.methods.transfer("TestRegister", ADDRESSES[1].address).send({
          gasLimit: 5000000,
          from: ADDRESSES[1].address
        })
        assert(false);
      } catch (err) {
        assert(true);
      }
    })
  });

  //since they are onetime tests I have no clue if they will pass
  describe("Registry one time tests", function() {
    this.timeout(120000);

    before("fund the multisig", async () => {
      const txData = {
        gasLimit: 500000,
        from: ADDRESSES[0].address,
        gasPrice: 1,
        to: values.address_book["VALIDATOR_NETOPS"],
        value: web3.utils.toWei("2", "gwei")
      }

      const txObject = await web3.eth.accounts.signTransaction(txData, ADDRESSES[0].privateKey)
      await web3.eth.sendSignedTransaction((txObject).rawTransaction)
    })

    it("should reserve a name properly", async () => {
      const txA = {
        value: "0",
        data: simpleReg.methods.reserve(randomName).encodeABI()
      };
      res1 = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      cowner = await simpleReg.methods.owner().call()

      //check if it worked
      res = await simpleReg.methods.entries(randomName).call()

      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"])
    });

    it("should abort reservation if name is already reserved", async () => {
      const txA = {
        value: "0",
        data: simpleReg.methods.reserve(randomName).encodeABI()
      };
      try {
          res1 = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
          assert(false);
      } catch (e) {
          assert(true);
      }
    });

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
        value: '0',
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
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      res2 = await simpleReg.methods.reverse(values.address_book["REGISTRY"]).call()
      assert.equal(res2, "")
    });

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
        data: simpleReg.methods.transfer(randomName, ADDRESSES[1].address).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      //check if it worked
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner.toLowerCase(), ADDRESSES[1].address.toLowerCase());

      await simpleReg.methods.transfer(randomName, values.address_book["VALIDATOR_NETOPS"]).send({
        from: ADDRESSES[1].address,
        gasLimit: 500000
      });
      //check if it worked
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner.toLowerCase(), values.address_book["VALIDATOR_NETOPS"].toLowerCase());
    });

    it("should not allow to transfer to address 0x0", async () => {
      const tx = {
        value: '0',
        data: simpleReg.methods.transfer(randomName, DEFAULT_ADDRESS).encodeABI()
      };
      try {
        await simpleReg.transfer(name, DEFAULT_ADDRESS, { from: accounts[1] });
        assert(false);
      } catch (e) {
        assert(true);
      }
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner.toLowerCase(), values.address_book["VALIDATOR_NETOPS"].toLowerCase());
    });

    it("should drop properly", async () => {
      const txA = { 
        value: '0',
        data: simpleReg.methods.drop(randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);

      res = await simpleReg.methods.entries(randomName).call()
      assert.equal(res.owner, DEFAULT_ADDRESS)
    });

    it("should allow to re-reserve a dropped name", async () => {
      const txA = { 
        value: '0',
        data: simpleReg.methods.reserve(randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["REGISTRY"]);
      
      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner, values.address_book["VALIDATOR_NETOPS"]);

      const txB = { 
        value: '0',
        data: simpleReg.methods.drop(randomName).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["REGISTRY"]);

      res = await simpleReg.methods.entries(randomName).call();
      assert.equal(res.owner, DEFAULT_ADDRESS);
    });

    it("should not allow interactions with dropped names", async () => {

        try {
            await simpleReg.getData(randomName, "1234");
            assert(false);
        } catch (e) {
            assert(true);
        }


        try {
            await simpleReg.getAddress(randomName, "1234");
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.getUint(randomName, "1234");
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.getOwner(randomName);
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.setData(randomName, "1234", "dummy");
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.setAddress(randomName, "1234", accounts[0]);
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.setUint(randomName, "1234", 100);
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.transfer(randomName, accounts[1]);
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.drop(randomName);
            assert(false);
        } catch (e) {
            assert(true);
        }

        try {
            await simpleReg.confirmReverse(web3.utils.sha3(randomName));
            assert(false);
        } catch (e) {
            assert(true);
        }
    });
  });
});
