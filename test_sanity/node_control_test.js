// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
const assert = require('assert');
const utils = require('./utils')

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const ADDRESSES = JSON.parse(fs.readFileSync("./accounts/testaccounts.json", "utf-8"));
var values = {};
var accounts;

const {ChainspecValues, MultiSigWalletJSON, NodeControlLookUpJSON, NodeControlSimpleJSON, NodeControlDbJSON} = require(__dirname + "/utils.js");

// tests
describe('NodeControl', function() {

  var nodeControlLookUp;
  var nodeControlSimple;
  var NodeControlLookUpABI;
  var NodeControlSimpleABI;
  var NodeControlDbABI;

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();
    web3.transactionConfirmationBlocks = 1;
    web3.eth.transactionConfirmationBlocks = 1;

    // retrieves the hardcoded values
    values = ChainspecValues;
    accounts = values.address_book["INITAL_VALIDATORS"];

    // gets the ABI of all contracts    
    NodeControlLookUpABI = NodeControlLookUpJSON;
    NodeControlSimpleABI = NodeControlSimpleJSON;
    NodeControlDbABI = NodeControlDbJSON;

    MultiSigABI = MultiSigWalletJSON;
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
      (await nodeControlLookUp.methods.owner().call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    });

    it("should return the correct/initial nodeControlSimple address", async function() {
      (await nodeControlLookUp.methods.nodeControlContract().call()).should.be.equal(values.address_book["NODECONTROL_SIMPLE"]);
    })

    it("should not allow someone other then the owner to change the nodeControlAddress", async function() {
      oldNodeControlAddress = await nodeControlLookUp.methods.nodeControlContract().call();
      try {
        await nodeControlLookUp.methods.changeAddress(ADDRESSES[0].address).call({
          from: ADDRESSES[1].address
        });
      } catch (err) {}
      (await nodeControlLookUp.methods.nodeControlContract().call()).should.be.equal(oldNodeControlAddress);
    })

    it("should allow owner to change the nodeControlSimple address", async function() {
      oldNodeControlAddress = await nodeControlLookUp.methods.nodeControlContract().call();
      //change to new address
      const txA = {
        value: '0',
        data: nodeControlLookUp.methods.changeAddress(ADDRESSES[1].address).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_LOOKUP"]);

      (await nodeControlLookUp.methods.nodeControlContract().call()).toLowerCase().should.be.equal(ADDRESSES[1].address.toLowerCase());
      //change back to original
      const txB = {
        value: '0',
        data: nodeControlLookUp.methods.changeAddress(values.address_book["NODECONTROL_SIMPLE"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["NODECONTROL_LOOKUP"]);

      (await nodeControlLookUp.methods.nodeControlContract().call()).should.be.equal(values.address_book["NODECONTROL_SIMPLE"]);
    })

  });

  describe('NodeControlSimple', function() {
    this.timeout(1200000);

    it('should be owned by NetOps', async function () {
      (await nodeControlSimple.methods.owner().call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    })

    it("should have nodeControlDb set", async function() {
      (await nodeControlSimple.methods.nodeControlDb().call()).should.be.equal(values.address_book["NODECONTROL_DB"]);
    })

    it("should not allow anyone other then the owner to update a validator state", async function() {
      oldValidatorState = await nodeControlSimple.methods.retrieveExpectedState(ADDRESSES[0].address).call();
      try {
        await nodeControlSimple.methods.updateValidator(ADDRESSES[0].address, "0xe", "parity", "0xf", "https://raw.githubusercontent.com/Volta.json", true).send({
          from: ADDRESSES[1].address,
          gasLimit: 50000
        });
      } catch (err) {}

      eState = await nodeControlSimple.methods.retrieveExpectedState(ADDRESSES[0].address).call();

      eState.dockerSha.should.be.equal(oldValidatorState.dockerSha);
      eState.dockerName.should.be.equal(oldValidatorState.dockerName);
      eState.chainSpecSha.should.be.equal(oldValidatorState.chainSpecSha);
      eState.chainSpecUrl.should.be.equal(oldValidatorState.chainSpecUrl);
      eState.isSigning.should.be.equal(oldValidatorState.isSigning);
    })

    it("should allow the owner to update a validator state", async function() {

      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(ADDRESSES[0].address, "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);

      var eState = await nodeControlSimple.methods.retrieveExpectedState(ADDRESSES[0].address).call();
      eState.dockerSha.should.be.equal("0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727");
      eState.dockerName.should.be.equal("parity/parity:v2.3.3");
      eState.chainSpecSha.should.be.equal("0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47");
      eState.chainSpecUrl.should.be.equal("https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json");
      eState.isSigning.should.be.equal(true);
    })

    it("should not allow the owner to update the validator state with an equal state", async function() {
      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(ADDRESSES[0].address, "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727", "parity/parity:v2.3.3", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);
      receipt.events.ExecutionFailure.should.be.an('object')
    })

    it("should return false if an update has not been confirmed", async function() {
      (await nodeControlDb.methods.isUpdateConfirmed(ADDRESSES[0].address).call()).should.be.equal(false);
    })

    it("should not allow anyone other then a validator to confirm its update", async function() {
      try {
        await nodeControlSimple.methods.confirmUpdate().send({
          from: ADDRESSES[1].address,
          gasLimit: 500000
        })
      } catch (err) {}

      (await nodeControlDb.methods.isUpdateConfirmed(ADDRESSES[1].address).call()).should.be.equal(false);
    })

    it("should allow a validator to confirm an update", async function() {
      await nodeControlSimple.methods.confirmUpdate().send({
        from: ADDRESSES[0].address,
        gasLimit: 500000
      });
      (await nodeControlDb.methods.isUpdateConfirmed(ADDRESSES[0].address).call()).should.be.equal(true);
    })

    it("should return true if an update has been confirmed", async function() {
      (await nodeControlDb.methods.isUpdateConfirmed(ADDRESSES[0].address).call()).should.be.equal(true);
    })

    it("should return the correct state for a validator", async function() {
      eState = await nodeControlSimple.methods.retrieveExpectedState(ADDRESSES[0].address).call();
      eState.dockerSha.should.be.equal("0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467727");
      eState.dockerName.should.be.equal("parity/parity:v2.3.3");
      eState.chainSpecSha.should.be.equal("0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca47");
      eState.chainSpecUrl.should.be.equal("https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json");
      eState.isSigning.should.be.equal(true);
    })

    //revert the state
    after("should prep the state for further tests", async function() {
      const txA = {
        value: '0',
        data: nodeControlSimple.methods.updateValidator(ADDRESSES[0].address, "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467720", "parity/parity:v2.3.0", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca40", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.jso0", false).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_SIMPLE"]);
    })

  });

  describe('NodeControlDB', function() {
    this.timeout(1200000);

    it('should be owned by NetOps', async function () {
      (await nodeControlDb.methods.owner().call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"]);
    })

    it("should have nodeControlSimple set", async function() {
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(values.address_book["NODECONTROL_LOOKUP"]);
    })

    it("should not allow anyone other then the owner to change the lookup contract", async function() {
      currentLookUp = await nodeControlDb.methods.nodeControlLookUp().call();
      try {
        await nodeControlDb.methods.changeLookUpContract(ADDRESSES[0].address).send({
          from: ADDRESSES[0].address
        });
      } catch (err) {}

      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(currentLookUp);
    })

    it("should not allow the owner to change the lookup to 0x0", async function() {
      currentLookUp = await nodeControlDb.methods.nodeControlLookUp().call();

      const txA = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract("0x0000000000000000000000000000000000000000").encodeABI()
      }
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_DB"]);

      receipt.events.ExecutionFailure.should.be.an('object');
      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(currentLookUp);
    })

    it("should allow the owner to change the lookup contract", async function() {
      const txA = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract(ADDRESSES[0].address).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["NODECONTROL_DB"]);


      (await nodeControlDb.methods.nodeControlLookUp().call()).toLowerCase().should.be.equal(ADDRESSES[0].address.toLowerCase());

      const txB = {
        value: '0',
        data: nodeControlDb.methods.changeLookUpContract(values.address_book["NODECONTROL_LOOKUP"]).encodeABI()
      }
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["NODECONTROL_DB"]);

      (await nodeControlDb.methods.nodeControlLookUp().call()).should.be.equal(values.address_book["NODECONTROL_LOOKUP"]);
    })

    it("should not allow anyone other then the logic contract to call setState", async function() {
      try {
        await nodeControlDb.methods.setState(ADDRESSES[0].address, "0xe0d81206592a85a612a3bdb4300f538f67f9229ef7ae0fc0c1a098eefa467721", "parity/parity:v2.3.1", "0xfda42852939fef61daccd00d20ef07e2316de2e023de48c861701bfa73cfca41", "https://raw.githubusercontent.com/energywebfoundation/ewf-chainspec/99fa89b92b35219ddf38c886a75623c85bc9c696/Volta.json", true).send({
          from: ADDRESSES[0].address,
          gasLimit: 50000
        });
        assert(false)
      } catch (err) {
        assert(true)
      }
    })

    it("should not allow anyone other then the logic contract to call setUpdateConfirmed", async function() {
      try {
        await nodeControlDb.methods.setUpdateConfirmed("0x0000000000000000000000000000000000000001").send({
          from: ADDRESSES[0].address,
          gasLimit: 50000
        });
        assert(false)
      } catch (err) {
        assert(true)
      }
    })
  });

});
