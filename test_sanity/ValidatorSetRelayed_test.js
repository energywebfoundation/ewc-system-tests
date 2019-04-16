// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');
const utils = require('./utils')

require('chai')
    .use(require('chai-as-promised'))
    .should();

    const expect = require('chai').expect;

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
//var web3 = new Web3('http://54.72.61.23:8545');
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const VALUES = "./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json"
var values = {};

// functions
async function getOwner(contract) {
  return await contract.methods.owner().call();
}

// tests
describe(' Contracts', function() {
  
  var relayed;
  var relay;
  var netOpsMultiSig;
  var communityMultiSig;
  var holding;
  let RelayContractABI;
  let RelayedContractABI;
  let MultiSigABI;
  let holdingABI;

  const RelayJSON = JSON.parse(
      fs.readFileSync(__dirname + "/../node_modules/genome-system-contracts/build/contracts/ValidatorSetRelay.json")
  );

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();
    web3.transactionConfirmationBlocks = 1;
    web3.eth.transactionConfirmationBlocks = 1;

    // retrieves the hardcoded values
    let jso = fs.readFileSync(VALUES, 'utf-8');
    values = JSON.parse(jso);

    // gets the ABI of all contracts   
    let me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/ValidatorSetRelayed.json', 'utf-8');
    RelayedContractABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/genome-system-contracts/build/contracts/ValidatorSetRelay.json', 'utf-8');
    RelayContractABI = JSON.parse(me);
    me = fs.readFileSync('./node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json', 'utf-8');
    MultiSigABI = JSON.parse(me);
    //MultiSigABI.abi = MultiSigABI.abi.concat(RelayedContractABI.abi.filter(event => event.type === 'event')) 
    utils.addTestWallets(web3);
  }

  before(async function (){
    this.timeout(60000);
    await initEverything();
    
    // links the contracts
    relayed = new web3.eth.Contract(RelayedContractABI.abi, values.address_book["VALIDATOR_RELAYED"]);
    relay = new web3.eth.Contract(RelayContractABI.abi, values.address_book["VALIDATOR_RELAY"]);
    netOpsMultiSig = new web3.eth.Contract(MultiSigABI.abi, values.address_book["VALIDATOR_NETOPS"]);

  });

  after(async () => {
    
    await web3.currentProvider.connection.close()
    console.log('connection closed')
  })

  describe.skip('constructor', async function () {
    // Not possible to test on Volta
  });

  describe.skip('#_triggerChange', async function () {
    // TODO: later
      // it('should revert on false returned callback value', async function () {
      //     const dummyRelay = await MockRelay.new(owner, relayed.address, { from: owner }).should.be.fulfilled;
      //     await relayed.setRelay(dummyRelay.address, { from: owner }).should.be.fulfilled;
      //     await dummyRelay.setCallbackRetval(false, { from: owner }).should.be.fulfilled;
      //     for (let i = 2; i < accounts.length; i++) {
      //         await relayed.addValidator(accounts[2], { from: owner }).should.be.rejectedWith(CALLBACK_ERROR);
      //     }
      // });
  });

  describe.skip('#finalizeChange', async function () {
    this.timeout(300000);

    it('should only be callable by the relay address', async function () {

      const txA = { 
          value: '0', 
          data: relayed.methods.setRelay(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
      (await relayed.methods.relaySet().call()).should.equal(web3.eth.accounts.wallet.accounts['2'].address)
      
      await expect(relayed.methods.finalizeChange().send({ from: web3.eth.accounts.wallet.accounts['2'].address })).to.be.rejectedWith(utils.PARITY_REVERT_MSG);
      
      const txB = { 
        value: '0', 
        data: relayed.methods.setRelay(values.address_book["VALIDATOR_RELAY"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
      (await relayed.methods.relaySet().call()).should.equal(values.address_book["VALIDATOR_RELAY"])

    });

    // system calls finalized not possible 
    // it('should only be callable if changes are not finalized yet', async function () {
      
    // });

    it('system should set finalized to true', async function () {
      (await relayed.methods.finalized().call()).should.be.true;
      const txA = { 
          value: '0', 
          data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.finalized().call()).should.be.false;
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      (await relayed.methods.finalized().call()).should.be.true;

      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.finalized().call()).should.be.false;
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);

      (await relayed.methods.finalized().call()).should.be.true;
      
    });

     // not possible
    // it('should set currentValidators to pendingValidators after constructor', async function () {

    // });

    it('should set currentValidators to pendingValidators after addValidator call', async function () {
      (await relayed.methods.finalized().call()).should.be.true;
      const txA = { 
          value: '0', 
          data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())
     
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())

      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())
    });


    // done by previos test
    // it('should set currentValidators to pendingValidators after removeValidator call', async function () {

    // });
  });

  describe.skip('#addValidator', async function () {
    this.timeout(300000);
    it('should only be callable by owner', async function () {
      await expect(relayed.methods.addValidator(web3.eth.accounts.wallet.accounts['2'].address).send({ from: web3.eth.accounts.wallet.accounts['2'].address }))
        .to.be.rejectedWith(utils.PARITY_REVERT_MSG)
    });

    it('should not allow to add already active validator', async function () {
      const currentValidators = await relayed.methods.getValidators().call()
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(currentValidators[0]).encodeABI()
      };
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      receipt.events.ExecutionFailure.should.not.be.undefined;   
    
    });

    // not possible
    // it('should not allow to add if not finalized', async function () {
        
    // });

    it('should not allow to add 0x0 addresses', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.DEFAULT_ADDRESS).encodeABI()
      };
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      receipt.events.ExecutionFailure.should.not.be.undefined;   
    });

    it('should set addressStatus for new validator correctly', async function () {
        let status = await relayed.methods.addressStatus(web3.eth.accounts.wallet.accounts['2'].address).call();
        status[0].toString(10).should.be.equal(utils.ValidatorState.NonValidator);
        status[1].toString(10).should.be.equal("0");

        
        const txA = { 
            value: '0', 
            data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
        };
        await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
        status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
        status[0].toString(10).should.be.equal(utils.ValidatorState.PendingToBeAdded);
        status[1].toString(10).should.be.equal("0");
      
        await utils.waitForSomething([
          {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
          {execute: relayed.methods.finalized().call, waitUntil: true}
        ]);
        await utils.sleep(5 * 5000);

        status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
        status[0].toString(10).should.be.equal(utils.ValidatorState.FinalizedValidator);
        status[1].toString(10).should.be.equal("3");
        
        const txB = { 
            value: '0', 
            data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
        };
        await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
        
        await utils.waitForSomething([
          {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
          {execute: relayed.methods.finalized().call, waitUntil: true}
        ]);
        await utils.sleep(5 * 5000);
        status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
        status[0].toString(10).should.be.equal(utils.ValidatorState.NonValidator);
        status[1].toString(10).should.be.equal("0");

    });

    // not possible
    // it('should not be finalized before finalize call', async function () {

    // });

    it('should update the pending set', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      const pendingValidators = await relayed.methods.getPendingValidators().call()
      pendingValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);

    });

    // Not possible
    // it('should not change the current validator set', async function () {

    // });

    it('should emit InitiateChange in relay with correct blockhash and pendingValidators', async function () {
      await utils.sleep(5000);
      const validators = [
        ...((await relayed.methods.getValidators().call()).map(address => address.toLowerCase())),
        utils.testValidators[0].toLowerCase()
      ];
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );

      const currentBlocknumber = receipt.blockNumber;
      const parent = await web3.eth.getBlock(currentBlocknumber - 1);
      const events = await relay.getPastEvents(
          "InitiateChange",
          {
              "fromBlock": currentBlocknumber,
              "toBlock": currentBlocknumber
          }
      );

      events[0].returnValues._parentHash.should.be.equal(parent.hash);
      events[0].returnValues._newSet.map(address => address.toLowerCase()).should.be.deep.equal(validators);

      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
    });
  })

  describe.skip('#removeValidator', async function () {
    this.timeout(300000);

    //done during #addValidator
    // it('should remove validator', async function () {
   
    // });

    // Not possible
    // it('should not try to remove from empty pending list', async function () {

    // });

    it('should only be callable by owner', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);

      await expect(relayed.methods.removeValidator(utils.testValidators[0]).send({ from: web3.eth.accounts.wallet.accounts['2'].address }))
        .to.be.rejectedWith(utils.PARITY_REVERT_MSG);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      
    });

    it('should only be allowed to remove from existing set of validators', async function () {
      //const currentValidators = await relayed.methods.getValidators().call()
      const txA = { 
        value: '0', 
        data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      receipt.events.ExecutionFailure.should.not.be.undefined;   
    });


    // not possible
    // it('should not allow to remove if not finalized', async function () {

    // });

    it('should allow remove after a failed remove', async function () {
  
      await expect(relayed.methods.removeValidator(utils.testValidators[0]).send({ from: web3.eth.accounts.wallet.accounts['2'].address }))
        .to.be.rejectedWith(utils.PARITY_REVERT_MSG);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      receipt.events.ExecutionFailure.should.not.be.undefined;
      
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.true

      const txC = { 
        value: '0', 
        data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txC, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.false
    });

    it('should change pending set correctly', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      let pendingValidators = await relayed.methods.getPendingValidators().call()
      pendingValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())
      pendingValidators.length.should.be.equal(4);
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      pendingValidators = await relayed.methods.getPendingValidators().call()
      pendingValidators.length.should.be.equal(3);
    });

    it('should change current set correctly', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      let currentValidators = await relayed.methods.getValidators().call()
      currentValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())
      currentValidators.length.should.be.equal(4);
      
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      await utils.sleep(5 * 5000);
      currentValidators = await relayed.methods.getValidators().call()
      currentValidators.length.should.be.equal(3);
    });

    // tested in addValidator
    // it('should change address status correctly', async function () {

    // });

    // not possible
    // it('should set finalized to false', async function () {

    // });
  });

  // not possible
  // describe("#_removeValidator", async function () {

  // });

  describe.skip("#getValidatorsNum", async function () {

    it('should return the correct validators number', async function () {
        let currentValidators = await relayed.methods.getValidators.call();
        let currentValidatorsLength = await relayed.methods.getValidatorsNum.call();
        currentValidators.length.toString().should.be.equal(currentValidatorsLength.toString(10))
        currentValidators.length.toString().should.be.equal('3');


    });
  });

  describe.skip('#isPendingToBeAdded', async function () {
    this.timeout(300000);

    it('should return true only if address is pending to be added', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.true;
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);

      await utils.sleep(5 * 5000);
      (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.false;

      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);
      (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.false;

    });
});

describe.skip('#isPendingToBeRemoved', async function () {
  this.timeout(300000);

    it('should return true only if address is pending to be removed', async function () {
      const txA = { 
        value: '0', 
        data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
    
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);

      await utils.sleep(5 * 5000);
      
      (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.false;
      const txB = { 
          value: '0', 
          data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
      (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.true;
      
      await utils.waitForSomething([
        {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
        {execute: relayed.methods.finalized().call, waitUntil: true}
      ]);

      (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.false;
    });
});

describe.skip('#isActiveValidator', async function () {

    it('should return true for active (sealing) validators only', async function () {

      const currentValidators = await relayed.methods.getValidators.call();
      (await relayed.methods.isActiveValidator(currentValidators[0]).call()).should.be.true;
      (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.false;
 
    });
});

describe.skip('#isFinalizedValidator', async function () {

    it('should return true for finaized validators only', async function () {
      const currentValidators = await relayed.methods.getValidators.call();
      (await relayed.methods.isFinalizedValidator(currentValidators[0]).call()).should.be.true;
      (await relayed.methods.isFinalizedValidator(utils.testValidators[0]).call()).should.be.false;
    });
});

// describe('#isPending', async function () {

//     it('returns true for pending-to-be-added/removed validators only', async function () {
//         (await relayed.isPending.call(accounts[1])).should.be.false;
//         (await relayed.addressStatus.call(accounts[1]))[0]
//             .should.be.bignumber.equals(ValidatorState.FinalizedValidator);

//         await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         (await relayed.isPending.call(accounts[2])).should.be.true;

//         await relay.finalizeChange({ from: system }).should.be.fulfilled;
//         (await relayed.isPending.call(accounts[2])).should.be.false;

//         await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         (await relayed.isPending.call(accounts[2])).should.be.true;

//         await relay.finalizeChange({ from: system }).should.be.fulfilled;
//         (await relayed.isPending.call(accounts[2])).should.be.false;
//     });
// });

// describe("#setRelay", async function () {

//     it('should be called successfully by owner', async function () {
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         let relayaddress = await relayed.relaySet.call();
//         relayaddress.should.equal(owner);
//     });

//     it('should emit event on success', async function () {
//         const { logs } = await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         logs[0].event.should.be.equal("NewRelay");
//         logs[0].args.relay.should.be.equal(owner);
//     });

//     it('should not be able to set it to 0x0', async function () {
//         let relayaddress = await relayed.relaySet.call();
//         await relayed.setRelay(DEFAULT_ADDRESS, { from: owner }).should.be.rejectedWith(RELAY_ADDRESS_ERROR);
//         let relayaddressAgain = await relayed.relaySet.call();
//         relayaddressAgain.should.equal(relayaddress);
//     });

//     it('should be only callable by owner', async function () {
//         await relayed.setRelay(accounts[4], { from: accounts[4] }).should.be.rejectedWith(NOT_OWNER_ERROR);
//         await relayed.setRelay(accounts[3], { from: accounts[3] }).should.be.rejectedWith(NOT_OWNER_ERROR);
//         await relayed.setRelay(accounts[6], { from: accounts[5] }).should.be.rejectedWith(NOT_OWNER_ERROR);
//         await relayed.setRelay(accounts[6], { from: owner }).should.be.fulfilled;
//         let relayaddress = await relayed.relaySet.call();
//         relayaddress.should.equal(accounts[6]);
//     });

//     it('should not allow same as the old one', async function () {
//         await relayed.setRelay(accounts[4], { from: owner }).should.be.fulfilled;
//         await relayed.setRelay(accounts[4], { from: owner }).should.be.rejectedWith(RELAY_SAME_ERROR);
//         let relayaddress = await relayed.relaySet.call();
//         relayaddress.should.equal(accounts[4]);
//     });
// });

// describe('#reportMalicious', async function () {

//     beforeEach(async function () {
//         await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         await relay.finalizeChange({ from: system }).should.be.fulfilled;
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//     });

//     it('should be called successfully', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
//     });

//     it('should only be called by the Relay contract', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: system }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;
//     });

//     it('should only be called by validator', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[4], accounts[1], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//         await relayed.reportMalicious(accounts[3], accounts[2], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//     });

//     it('should only be called on validator', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[2], accounts[1], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[1], accounts[4], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//         await relayed.reportMalicious(accounts[2], accounts[3], bn - 1, "0x0", { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//     });

//     it('should only be called on existing block number', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[1], accounts[2], bn - 1, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner }).should.be.fulfilled;

//         // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
//         await relayed.reportMalicious(accounts[1], accounts[2], (await web3.eth.getBlockNumber()) + 1, "0x0", { from: owner })
//             .should.be.rejectedWith(REVERT_ERROR_MSG);
//         await relayed.reportMalicious(accounts[2], accounts[1], (await web3.eth.getBlockNumber()) + 100, "0x0", { from: owner })
//             .should.be.rejectedWith(REVERT_ERROR_MSG);
//     });

//     it('should emit an event', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         let { logs } = await relayed.reportMalicious(accounts[2], accounts[1], bn, "0x0", { from: owner })
//             .should.be.fulfilled;
//         logs[0].event.should.be.equal("ReportedMalicious");
//         logs[0].args[0].should.be.equal(accounts[2]);
//         logs[0].args[1].should.be.equal(accounts[1]);
//         logs[0].args[2].toNumber(10).should.be.equal(bn);
//     });

//     it('should not accept report on a pending-to-be-added validator', async function () {
//         await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
//         await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
//         let bn = await web3.eth.getBlockNumber();
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
//         await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
//         bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[1], accounts[3], bn, "0x0", { from: owner }).should.be.fulfilled;
//     });

//     it('should accept report on a pending-to-be-removed validator', async function () {
//         await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
//         await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         let bn = await web3.eth.getBlockNumber();
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.fulfilled;
//         await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
//         bn = await web3.eth.getBlockNumber();
//         await relayed.reportMalicious(accounts[1], accounts[2], bn, "0x0", { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
//     });
// });

// describe('#reportBenign', async function () {

//     beforeEach(async function () {
//         await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         await relay.finalizeChange({ from: system }).should.be.fulfilled;
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//     });

//     it('should be called successfully', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
//     });

//     it('should only be called by the Relay contract', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: system }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;
//     });

//     it('should only be called by validator', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[4], accounts[1], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//         await relayed.reportBenign(accounts[3], accounts[2], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//     });

//     it('should only be called on validator', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[2], accounts[1], bn - 1, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[1], accounts[4], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//         await relayed.reportBenign(accounts[2], accounts[3], bn - 1, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//     });

//     it('should only be called on existing block number', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[1], accounts[2], bn - 1, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner }).should.be.fulfilled;

//         // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
//         await relayed.reportBenign(accounts[1], accounts[2], (await web3.eth.getBlockNumber()) + 1, { from: owner })
//             .should.be.rejectedWith(REVERT_ERROR_MSG);
//         await relayed.reportBenign(accounts[2], accounts[1], (await web3.eth.getBlockNumber()) + 100, { from: owner })
//             .should.be.rejectedWith(REVERT_ERROR_MSG);
//     });

//     it('should emit an event', async function () {
//         const bn = await web3.eth.getBlockNumber();
//         let { logs } = await relayed.reportBenign(accounts[2], accounts[1], bn, { from: owner })
//             .should.be.fulfilled;
//         logs[0].event.should.be.equal("ReportedBenign");
//         logs[0].args[0].should.be.equal(accounts[2]);
//         logs[0].args[1].should.be.equal(accounts[1]);
//         logs[0].args[2].toNumber(10).should.be.equal(bn);
//     });

//     it('should not accept report on a pending-to-be-added validator', async function () {
//         await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
//         await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
//         let bn = await web3.eth.getBlockNumber();
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
//         await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
//         bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[1], accounts[3], bn, { from: owner }).should.be.fulfilled;
//     });

//     it('should accept report on a pending-to-be-removed validator', async function () {
//         await relayed.setRelay(relayAddress, { from: owner }).should.be.fulfilled;
//         await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
//         let bn = await web3.eth.getBlockNumber();
//         await relayed.setRelay(owner, { from: owner }).should.be.fulfilled;
//         await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.fulfilled;
//         await relayed.finalizeChange({ from: owner }).should.be.fulfilled;
//         bn = await web3.eth.getBlockNumber();
//         await relayed.reportBenign(accounts[1], accounts[2], bn, { from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
//     });
//   });

});
