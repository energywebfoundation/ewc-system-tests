// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');

//var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const VALUES = "./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json"
var values = {};

const block_number = 0;

// tests
describe('Contracts', function() {

  this.timeout(60000);

  async function initEverything(done) {
    // ensures that web3 is connected
    let listening = await web3.eth.net.isListening();

    // retrieves the hardcoded values
    let jso = fs.readFileSync(VALUES, 'utf-8');
    values = JSON.parse(jso);

  }

  before(async function (){
    await initEverything();
  });

  describe('Balance of Holding contract', function() {

    it('should be 4.07895E+25 wei', async function() {
      let deployedHolding = values.address_book['VESTING'];
      let hardcodedHolding = values.balances['TARGET_AMOUNT'];
      (await web3.eth.getBalance(deployedHolding, block_number)).should.be.equal(hardcodedHolding);
    });

  });

  describe('Total balance of Ignitor accounts', function() {

    it('should sum to 1 token', async function() {
      let sum = 0;
      let deployed = values.address_book['IGNITOR_MEMBERS'];
      let hardcoded = 1000000000000000000;
      
      for (let i = 0; i < values.address_book['IGNITOR_MEMBERS'].length; i++) {
        sum += parseInt(await web3.eth.getBalance(values.address_book['IGNITOR_MEMBERS'][i], block_number));
        console.log(sum);
      }
      sum.should.be.equal(hardcoded);
    });

  });

  describe('Balances of Validators contracts', function() {

    it('ValidatorRelay should be 0 wei', async function() {
      let deployed = values.address_book['VALIDATOR_RELAY'];
      let hardcoded = "0";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('ValidatorRelayed should be 0 wei', async function() {
        let deployed = values.address_book['VALIDATOR_RELAYED'];
        let hardcoded = "0";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });    

  });

  describe('Balances of NodeControl contracts', function() {

    it('Lookup should be 0 wei', async function() {
      let deployed = values.address_book['NODECONTROL_LOOKUP'];
      let hardcoded = "0";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('DB should be 0 wei', async function() {
        let deployed = values.address_book['NODECONTROL_DB'];
        let hardcoded = "0";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('Simple should be 0 wei', async function() {
        let deployed = values.address_book['NODECONTROL_SIMPLE'];
        let hardcoded = "0";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

  });

  describe('Balance of Reward contract', function() {

    it('should be 0 wei', async function() {
      let deployed = values.address_book['REWARD'];
      let hardcoded = "0";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    }); 

  });

  describe('Balance of Registry contract', function() {

    it('should be 0 wei', async function() {
      let deployed = values.address_book['REGISTRY'];
      let hardcoded = "0";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    }); 

  });

  describe('Balances of Multisig contracts', function() {

    it('CommunityFund should be 0 wei', async function() {
      let deployed = values.address_book['COMMUNITY_FUND'];
      let hardcoded = "0";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('NetOps should be 0 wei', async function() {
        let deployed = values.address_book['VALIDATOR_NETOPS'];
        let hardcoded = "0";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });    

    it('EWAG should be 11310499.3 tokens', async function() {
      let deployed = values.address_book['EWAG_MULTISIG'];
      let hardcoded = values.balances['EWAG'];
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

  });

  describe('Balance of precompiled contracts', function() {

    it('ecrecover should be 1 wei', async function() {
      let deployed = "0x0000000000000000000000000000000000000001";
      let hardcoded = "1";
      (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('sha256 should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000002";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('ripemd160 should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000003";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('identity should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000004";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('modexp should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000005";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('alt_bn128_add should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000006";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('alt_bn128_mul should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000007";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

    it('alt_bn128_pairing should be 1 wei', async function() {
        let deployed = "0x0000000000000000000000000000000000000008";
        let hardcoded = "1";
        (await web3.eth.getBalance(deployed, block_number)).should.be.equal(hardcoded);
    });

  });

});
