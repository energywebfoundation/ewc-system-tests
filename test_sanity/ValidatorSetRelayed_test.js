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
describe.skip(' Contracts', function() {

  var relayed;
  var relay;
  var netOpsMultiSig;
  var communityMultiSig;
  var holding;
  let RelayContractABI;
  let RelayedContractABI;
  let MultiSigABI;
  let holdingABI;

  const POTENTIAL_VALIDATOR_A = '0xdd520827a407b44753723ceb2614b5e0cbb1cd69';
  const POTENTIAL_VALIDATOR_B = '0x18e089e83026fac89c029762a901d90b7acc0d2b';
  const POTENTIAL_VALIDATOR_C = '0xca51975cccdf82bda569585f8ed12b0781a05740';

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

//   after(async () => {
    
//     //await web3.currentProvider.connection.close()
//     console.log('connection closed')
//   })

    describe('Validator Relayed', function() {
        this.timeout(300000);
        
        it('should have the correct initial validators', async function () {
            (await relayed.methods.getValidators().call()).should.be.deep.equal([ '0x7e8B8661DbC77d6bEe7A1892FbcF8EF6378caB30',
            '0xdae561C716F9ea58e32E37D9Ae95465ECA286012',
            '0xEBEe2FC556975c3Dd50c17D13a15Af535FB7bbb3' ])
        });

        it('should should initially be finalized', async function () {
            (await relayed.methods.finalized().call()).should.be.true;
        });

        it('should have the correct owner', async function () {
            (await relayed.methods.owner().call()).should.be.equal(values.address_book["VALIDATOR_NETOPS"])
        });

        it('should be possible to add a validator', async function () {
          const txA = { 
              value: '0', 
              data: relayed.methods.addValidator(POTENTIAL_VALIDATOR_B).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.isPendingToBeAdded(POTENTIAL_VALIDATOR_B).call()).should.be.true;
        
          await utils.waitForSomething([
            {execute: relayed.methods.isPendingToBeAdded(POTENTIAL_VALIDATOR_B).call, waitUntil: false },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);

          await utils.sleep(5 * 5000);
          
          (await relayed.methods.isActiveValidator(POTENTIAL_VALIDATOR_B).call()).should.be.true;
          const txB = { 
              value: '0', 
              data: relayed.methods.removeValidator(POTENTIAL_VALIDATOR_B).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, values.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.isPendingToBeRemoved(POTENTIAL_VALIDATOR_B).call()).should.be.true;
          
          await utils.waitForSomething([
            {execute: relayed.methods.isPendingToBeRemoved(POTENTIAL_VALIDATOR_B).call, waitUntil: false },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);

          (await relayed.methods.isPendingToBeRemoved(POTENTIAL_VALIDATOR_B).call()).should.be.false;
          (await relayed.methods.isActiveValidator(POTENTIAL_VALIDATOR_B).call()).should.be.false;
          (await relayed.methods.isPendingToBeAdded(POTENTIAL_VALIDATOR_B).call()).should.be.false;
          
        });

        it('should not be possible to add a validator 0x0', async function () {
          const txA = { 
              value: '0', 
              data: relayed.methods.addValidator('0x0000000000000000000000000000000000000000').encodeABI()
          };
          const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, values.address_book["VALIDATOR_RELAYED"] );
          receipt.events.ExecutionFailure.should.not.be.undefined;     
        });
    });

    describe('Validator Relayed', function () {
      this.timeout(300000);

      it('should not be possible to call finalizeChange from any address', async function () {
 
        await expect(relayed.methods.finalizeChange.send({
          from: web3.eth.accounts.wallet.accounts[0].address, gas: 5000000 
        })).to.be.rejectedWith(utils.PARITY_REVERT_MSG);
        //await relayed.finalizeChange({ from: relayAddress }).should.be.fulfilled;
      });

    })
});
