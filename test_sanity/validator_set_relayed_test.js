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
var values = {};

const {ChainspecValues, MultiSigWalletJSON, RelayedJSON, RelayJSON} = require(__dirname + "/utils.js");

// functions
async function getOwner(contract) {
  return await contract.methods.owner().call();
}

// tests
describe('ValidatorSetRelayed', function() {

  var relayed;
  var relay;
  var netOpsMultiSig;
  let RelayContractABI;
  let RelayedContractABI;
  let MultiSigABI;

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();
    web3.transactionConfirmationBlocks = 1;
    web3.eth.transactionConfirmationBlocks = 1;

    // retrieves the hardcoded values
    values = ChainspecValues;

    // gets the ABI of all contracts   
    RelayedContractABI = RelayedJSON;
    RelayContractABI = RelayJSON;
    MultiSigABI = MultiSigWalletJSON;
    MultiSigABI.abi = MultiSigABI.abi.concat(RelayedContractABI.abi.filter(event => event.type === 'event'))
    utils.addTestWallets(web3);
    console.log(await web3.eth.getBalance('0x9d5fe5d9d13b6af848b09f7293b1b75a578d6140'))
  }

  before(async function () {
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

  describe('#finalizeChange', async function () {
    this.timeout(300000);

    it('should only be callable by the relay address', async function () {

      const txA = {
        value: '0',
        data: relayed.methods.setRelay(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
      (await relayed.methods.relaySet().call()).should.equal(web3.eth.accounts.wallet.accounts['2'].address)

      await expect(relayed.methods.finalizeChange().send({
        from: web3.eth.accounts.wallet.accounts['2'].address
      })).to.be.rejectedWith(utils.PARITY_REVERT_MSG);

      const txB = {
        value: '0',
        data: relayed.methods.setRelay(values.address_book["VALIDATOR_RELAY"]).encodeABI()
      };
      await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
      (await relayed.methods.relaySet().call()).should.equal(values.address_book["VALIDATOR_RELAY"])

    });

    // it('system should set finalized to true', async function () {
    //   (await relayed.methods.finalized().call()).should.be.true;
    //   const txA = {
    //     value: '0',
    //     data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
    //   };
    //   await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
    //   (await relayed.methods.finalized().call()).should.be.false;
    //   await utils.waitForSomething([
    //     {
    //       execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
    //       waitUntil: false
    //     },
    //     {
    //       execute: relayed.methods.finalized().call,
    //       waitUntil: true
    //     }
    //   ]);

    //   (await relayed.methods.finalized().call()).should.be.true;

    //   const txB = {
    //     value: '0',
    //     data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
    //   };
    //   await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);
    //   (await relayed.methods.finalized().call()).should.be.false;

    //   await utils.waitForSomething([
    //     {
    //       execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
    //       waitUntil: false
    //     },
    //     {
    //       execute: relayed.methods.finalized().call,
    //       waitUntil: true
    //     }
    //   ]);

    //   (await relayed.methods.finalized().call()).should.be.true;

    // });

    // it('should set currentValidators to pendingValidators after addValidator call', async function () {
    //   (await relayed.methods.finalized().call()).should.be.true;
    //   const txA = {
    //     value: '0',
    //     data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
    //   };
    //   await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
    //   (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())

    //   await utils.waitForSomething([
    //     {
    //       execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
    //       waitUntil: false
    //     },
    //     {
    //       execute: relayed.methods.finalized().call,
    //       waitUntil: true
    //     }
    //   ]);

    //   (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())

    //   const txB = {
    //     value: '0',
    //     data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
    //   };
    //   await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);
    //   (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())

    //   await utils.waitForSomething([
    //     {
    //       execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
    //       waitUntil: false
    //     },
    //     {
    //       execute: relayed.methods.finalized().call,
    //       waitUntil: true
    //     }
    //   ]);

    //   (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())
    // });
  });

  // describe('#addValidator', async function () {
  //   this.timeout(300000);
  //   it('should only be callable by owner', async function () {
  //     await expect(relayed.methods.addValidator(web3.eth.accounts.wallet.accounts['2'].address).send({
  //       from: web3.eth.accounts.wallet.accounts['2'].address
  //     }))
  //       .to.be.rejectedWith(utils.PARITY_REVERT_MSG)
  //   });

  //   it('should not allow to add already active validator', async function () {
  //     const currentValidators = await relayed.methods.getValidators().call()
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(currentValidators[0]).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;

  //   });

  //   it('should not allow to add 0x0 addresses', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.DEFAULT_ADDRESS).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;
  //   });

  //   it('should set addressStatus for new validator correctly', async function () {
  //     let status = await relayed.methods.addressStatus(web3.eth.accounts.wallet.accounts['2'].address).call();
  //     status[0].toString(10).should.be.equal(utils.ValidatorState.NonValidator);
  //     status[1].toString(10).should.be.equal("0");

  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
  //     status[0].toString(10).should.be.equal(utils.ValidatorState.PendingToBeAdded);
  //     status[1].toString(10).should.be.equal("0");

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
  //     status[0].toString(10).should.be.equal(utils.ValidatorState.FinalizedValidator);
  //     status[1].toString(10).should.be.equal("3");

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     status = await relayed.methods.addressStatus(utils.testValidators[0]).call();
  //     status[0].toString(10).should.be.equal(utils.ValidatorState.NonValidator);
  //     status[1].toString(10).should.be.equal("0");

  //   });

  //   it('should update the pending set', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     const pendingValidators = await relayed.methods.getPendingValidators().call()
  //     pendingValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);
  //   });

  //   it('should emit InitiateChange in relay with correct blockhash and pendingValidators', async function () {
  //     await utils.sleep(5000);
  //     const validators = [
  //       ...((await relayed.methods.getValidators().call()).map(address => address.toLowerCase())),
  //       utils.testValidators[0].toLowerCase()
  //     ];
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);

  //     const currentBlocknumber = receipt.blockNumber;
  //     const parent = await web3.eth.getBlock(currentBlocknumber - 1);
  //     const events = await relay.getPastEvents(
  //       "InitiateChange",
  //       {
  //         "fromBlock": currentBlocknumber,
  //         "toBlock": currentBlocknumber
  //       }
  //     );

  //     events[0].returnValues._parentHash.should.be.equal(parent.hash);
  //     events[0].returnValues._newSet.map(address => address.toLowerCase()).should.be.deep.equal(validators);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //   });
  // })

  // describe('#removeValidator', async function () {
  //   this.timeout(300000);

  //   it('should only be callable by owner', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     await expect(relayed.methods.removeValidator(utils.testValidators[0]).send({
  //       from: web3.eth.accounts.wallet.accounts['2'].address
  //     }))
  //       .to.be.rejectedWith(utils.PARITY_REVERT_MSG);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //   });

  //   it('should only be allowed to remove from existing set of validators', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;
  //   });

  //   it('should allow remove after a failed remove', async function () {

  //     await expect(relayed.methods.removeValidator(utils.testValidators[0]).send({
  //       from: web3.eth.accounts.wallet.accounts['2'].address
  //     }))
  //       .to.be.rejectedWith(utils.PARITY_REVERT_MSG);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;

  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.true

  //     const txC = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txC, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.false
  //   });

  //   it('should change pending set correctly', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     let pendingValidators = await relayed.methods.getPendingValidators().call()
  //     pendingValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())
  //     pendingValidators.length.should.be.equal(4);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     pendingValidators = await relayed.methods.getPendingValidators().call()
  //     pendingValidators.length.should.be.equal(3);
  //   });

  //   it('should change current set correctly', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     let currentValidators = await relayed.methods.getValidators().call()
  //     currentValidators['3'].toLowerCase().should.be.equal(utils.testValidators[0].toLowerCase())
  //     currentValidators.length.should.be.equal(4);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     currentValidators = await relayed.methods.getValidators().call()
  //     currentValidators.length.should.be.equal(3);
  //   });

  // });

  // describe("#getValidatorsNum", async function () {

  //   it('should return the correct validators number', async function () {
  //     let currentValidators = await relayed.methods.getValidators.call();
  //     let currentValidatorsLength = await relayed.methods.getValidatorsNum.call();
  //     currentValidators.length.toString().should.be.equal(currentValidatorsLength.toString(10))
  //     currentValidators.length.toString().should.be.equal('3');

  //   });
  // });

  // describe('#isPendingToBeAdded', async function () {
  //   this.timeout(300000);

  //   it('should return true only if address is pending to be added', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.true;

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.false;

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);
  //     (await relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call()).should.be.false;

  //   });
  // });

  // describe('#isPendingToBeRemoved', async function () {
  //   this.timeout(300000);

  //   it('should return true only if address is pending to be removed', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.false;
  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);
  //     (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.true;

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call()).should.be.false;
  //   });
  // });

  // describe('#isActiveValidator', async function () {

  //   it('should return true for active (sealing) validators only', async function () {

  //     const currentValidators = await relayed.methods.getValidators.call();
  //     (await relayed.methods.isActiveValidator(currentValidators[0]).call()).should.be.true;
  //     (await relayed.methods.isActiveValidator(utils.testValidators[0]).call()).should.be.false;

  //   });
  // });

  // describe('#isFinalizedValidator', async function () {

  //   it('should return true for finaized validators only', async function () {
  //     const currentValidators = await relayed.methods.getValidators.call();
  //     (await relayed.methods.isFinalizedValidator(currentValidators[0]).call()).should.be.true;
  //     (await relayed.methods.isFinalizedValidator(utils.testValidators[0]).call()).should.be.false;
  //   });
  // });

  // describe('#isPending', async function () {
  //   this.timeout(300000);

  //   it('returns true for pending-to-be-added/removed validators only', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     (await relayed.methods.isPending(utils.testValidators[0]).call()).should.be.true;

  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeAdded(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);

  //     (await relayed.methods.isPending(utils.testValidators[0]).call()).should.be.false;

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]);
  //     (await relayed.methods.isPending(utils.testValidators[0]).call()).should.be.true;
  //     await utils.waitForSomething([
  //       {
  //         execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call,
  //         waitUntil: false
  //       },
  //       {
  //         execute: relayed.methods.finalized().call,
  //         waitUntil: true
  //       }
  //     ]);
  //     (await relayed.methods.isPending(utils.testValidators[0]).call()).should.be.false;
  //   });
  // });

  // describe("#setRelay", async function () {
  //   this.timeout(300000);

  //   it('should be called successfully by owner', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.setRelay(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
  //     (await relayed.methods.relaySet().call()).should.equal(web3.eth.accounts.wallet.accounts['2'].address)

  //     await expect(relayed.methods.finalizeChange().send({
  //       from: web3.eth.accounts.wallet.accounts['2'].address
  //     })).to.be.rejectedWith(utils.PARITY_REVERT_MSG);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.setRelay(values.address_book["VALIDATOR_RELAY"]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
  //     (await relayed.methods.relaySet().call()).should.equal(values.address_book["VALIDATOR_RELAY"])
  //   });

  //   it('should emit event on success', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.setRelay(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.NewRelay.should.not.be.undefined;
  //     receipt.events.NewRelay.returnValues.relay.should.be.equal(web3.eth.accounts.wallet.accounts['2'].address);

  //     (await relayed.methods.relaySet().call()).should.equal(web3.eth.accounts.wallet.accounts['2'].address);

  //     const txB = {
  //       value: '0',
  //       data: relayed.methods.setRelay(values.address_book["VALIDATOR_RELAY"]).encodeABI()
  //     };
  //     await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"]).should.be.fulfilled;
  //     (await relayed.methods.relaySet().call()).should.equal(values.address_book["VALIDATOR_RELAY"])

  //   });

  //   it('should not be able to set it to 0x0', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.setRelay(utils.DEFAULT_ADDRESS).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;
  //   });

  //   it('should not allow same as the old one', async function () {
  //     const txA = {
  //       value: '0',
  //       data: relayed.methods.setRelay(await relayed.methods.relaySet.call()).encodeABI()
  //     };
  //     const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"]);
  //     receipt.events.ExecutionFailure.should.not.be.undefined;
  //   });
  // });

});
