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

  var relayed;
  var nodeControlLookUp;
  var nodeControlSimple;
  var ndoeControlDb;
  var NodeControlLookUpABI;
  var NodeControlSimpleABI;
  var NodeControlDbABI;
  let RelayContractABI;

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
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/NodeControlLookUp.json', 'utf-8');
    NodeControlLookUpABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/NodeControlSimple.json', 'utf-8');
    NodeControlSimpleABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/NodeControlDb.json', 'utf-8');
    NodeControlDbABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
    utils.addTestWallets(web3);
  }

  before(async function () {
    this.timeout(60000);
    await initEverything();
    // links the contracts
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);
    nodeControlLookUp = new web3.eth.Contract(NodeControlLookUpABI.abi, values.address_book["NODECONTROL_LOOKUP"]);
    nodeControlSimple = new web3.eth.Contract(NodeControlSimpleABI.abi, values.address_book["NODECONTROL_SIMPLE"]);
    nodeControlDb = new web3.eth.Contract(NodeControlDbABI.abi, values.address_book["NODECONTROL_DB"]);
  });

  describe('NodeControlLookUp', function() {
    this.timeout(120000);

    it('should be owned by NetOps', async function () {
      (await nodeControlLookUp.methods.owner.call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    });

    it("should return the correct/initial nodeControlSimple address", async function() {
      (await nodeControlLookUp.methods.nodeControlContract.call()).should.be.equal(values.address_book["NODECONTROL_SIMPLE"]);
    })

    it("should not allow someone other then the owner to change the nodeControlAddress", async function() {
      oldNodeControlAddress = await nodeControlLookUp.methods.nodeControlContract().call();
      try {
        await nodeControlLookUp.methods.changeAddress(accounts[0]).call({
          from: accounts[0]
        });
      } catch (err) {}
      (await nodeControlLookUp.methods.nodeControlContract().call()).should.be.equal(oldNodeControlAddress);
    })

    it.skip("should allow owner to change the nodeControlSimple address", async function() {
      oldNodeControlAddress = await nodeControlLookUp.methods.nodeControlContract.call();
      //change to new address
      ///@dev change to multisig here!!
      const txA = {
        value: '0',
        data: nodeControlLookUp.methods.changeAddress(accounts[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_LOOKUP"]);

      (await nodeControlLookUp.methods.nodeControlContract.call()).toLowerCase().should.be.equal(accounts[0]);
      //change back to original
      ///@dev change to multisig here!!
      const txB = {
        value: '0',
        data: nodeControlLookUp.methods.changeAddress(values.address_book["NODECONTROL_SIMPLE"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["NODECONTROL_LOOKUP"]);

      (await nodeControlLookUp.methods.nodeControlContract.call()).should.be.equal(values.address_book["NODECONTROL_SIMPLE"]);
    })

  });

  describe('NodeControlSimple', function() {
    this.timeout(1200000);

    it('should be owned by NetOps', async function () {
      (await nodeControlSimple.methods.owner.call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    })

    it("should have nodeControlDb set", async function() {
      (await nodeControlSimple.methods.nodeControlDb.call()).should.be.equal(values.address_book["NODECONTROL_DB"]);
    })

    it("should not allow anyone other then the owner to update a validator state", async function() {
      oldValidatorState = await nodeControlSimple.methods.retrieveExpectedState(accounts[0]).call();
      try {
        await nodeControlSimple.methods.updateValidator(accounts[0], "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).send({
          from: accounts[0]
        });
      } catch (err) {
        console.log(err)
      }
      (await nodeControlSimple.methods.retrieveExpectedState(accounts[0]).call()).should.be.equal(oldValidatorState);
    })

    it.skip("should allow the owner to update a validator state", async function() {

      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(accounts[0], "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);

      var eState = await nodeControlSimple.methods.retrieveExpectedState(accounts[0]).call();
      eState.dockerSha.should.be.equal("0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727");
      eState.dockerName.should.be.equal("parity/parity:v2.3.3");
      eState.chainSpecSha.should.be.equal("0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47");
      eState.chainSpecUrl.should.be.equal("https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json");
      eState.isSigning.should.be.equal(true);
    })

    it.skip("should not allow the owner to update the validator state with an equal state", async function() {
      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(accounts[0], "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);
      receipt.events.ExecutionFailure.should.be.an('object')
    })

    it.skip("should return false if an update has not been confirmed", async function() {
      (await nodeControlSimple.methods.isConfirmed(accounts[0]).call()).should.be.equal(false);
    })

    it.skip("should not allow anyone other then a validator to confirm its update", async function() {
      const receipt = await nodeControlSimple.methods.confirmUpdate().send({
        from: accounts[1]
      })
      receipt.events.ExecutionFailure.should.be.an('object')(await nodeControlSimple.methods.isConfirmed(accounts[1]).call()).should.be.equal(false);
    })

    it.skip("should allow a validator to confirm an update", async function() {
      await nodeControlSimple.methods.confirmUpdate().send({
        from: accounts[0]
      });
      (await nodeControlSimple.methods.isConfirmed(accounts[0]).call()).should.be.equal(true);
    })

    it.skip("should return true if an update has been confirmed", async function() {
      (await nodeControlSimple.methods.isConfirmed().call(accounts[0])).should.be.equal(true);
    })

    it.skip("should return the correct state for a validator", async function() {
      contractState = await nodeControlSimple.methods.retrieveExpectedState(accounts[0]).call();
      console.log(contractState)
    ///@dev compare states
    })

    //revert the state
    it("should prep the state for further tests", async function() {
      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(accounts[0], "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467720", "parity/parity:v2.3.0", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca40", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.jso0", false).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);
    })

  });

  describe('NodeControlDB', function() {

    it.skip('should be owned by NetOps', async function () {
      (await nodeControlDb.methods.owner().call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    })

    it.skip("should have nodeControlSimple set", async function() {
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(values.address_book["NODECONTROL_LOOKUP"]);
    })

    it.skip("should not allow anyone other then the owner to change the lookup contract", async function() {
      const receipt = currentLookUp = await nodeControlDb.methods.nodeControlLookUp().call();
      await nodeControlDb.methods.changeLookUpContract(accounts[0]).send({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(currentLookUp);
    })

    it.skip("should not allow the owner to change the lookup to 0x0", async function() {
      currentLookUp = await nodeControlDb.methods.nodeControlLookUp().call();
      ///@dev change to multisig here!!

      const txA = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract("0x0000000000000000000000000000000000000000").encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_DB"]);

      receipt.events.ExecutionFailure.should.be.an('object');
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(currentLookUp);
    })

    it.skip("should allow the owner to change the lookup contract", async function() {
      ///@dev change to multisig here!!
      const txA = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract(accounts[0]).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_DB"]);
      receipt.events.ExecutionFailure.should.be.an('object');
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(accounts[0]);
      ///@dev change to multisig here!!
      const txB = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract(values.address_book["NODECONTROL_LOOKUP"]).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["NODECONTROL_DB"]);
      receipt.events.ExecutionFailure.should.be.an('object');
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(values.address_book["NODECONTROL_LOOKUP"]);
    })

    it.skip("should not allow anyone other then the logic contract to call setState", async function() {
      const receipt = await nodeControlDb.methods.setState(accounts[0], "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).send({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call setUpdateConfirmed", async function() {
      const receipt = await nodeControlDb.methods.setUpdateConfirmed("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call isUpdateConfirmed", async function() {
      const receipt = await nodeControlDb.methods.isUpdateConfirmed().call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getState", async function() {
      const receipt = await nodeControlDb.methods.getState("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getDockerSha", async function() {
      const receipt = await nodeControlDb.methods.getDockerSha("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getDockerName", async function() {
      const receipt = await nodeControlDb.methods.getDockerName("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getChainSpecSha", async function() {
      const receipt = await nodeControlDb.methods.getChainSpecSha("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getChainSpecUrl", async function() {
      const receipt = await nodeControlDb.methods.getChainSpecUrl("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
    it.skip("should not allow anyone other then the logic contract to call getIsSigning", async function() {
      const receipt = await nodeControlDb.methods.getIsSigning("0x0000000000000000000000000000000000000001").call({
        from: accounts[0]
      });
      receipt.events.ExecutionFailure.should.be.an('object');
    })
  });

});
