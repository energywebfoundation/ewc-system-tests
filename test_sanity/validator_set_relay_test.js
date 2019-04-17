
const BN = require('bn.js');
require('chai')
    .use(require('chai-as-promised'))
    .should();
const expect = require('chai').expect;
const utils = require('./utils')

const {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32,
    sendMultisigTransaction,
    addTestWallets,
    ValidatorState,
    ChainspecValues,
    MultiSigWalletJSON,
    RelayedJSON,
    RelayJSON,
    BlockRewardJSON,
    initialValidators,
    testValidators,
    address_book,
    testPayoutAddresses,
    TestSCurveProvder
} = require(__dirname + "/utils.js");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));

addTestWallets(web3);

let relayed;
let relay;

describe('ValidatorSetRELAY contract', function () {

    this.timeout(150000);

    let owner;
    let netOpsMultiSig;
    let accounts;

    let standardGas;

    before(async function () {
        (await web3.eth.net.isListening()).should.be.true;
        web3.transactionConfirmationBlocks = 1;
        web3.eth.transactionConfirmationBlocks = 1;
        standardGas = 500000

        netOpsMultiSig = new web3.eth.Contract(MultiSigWalletJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_NETOPS"]));
        owner = web3.utils.toChecksumAddress(netOpsMultiSig.address);

        relayed = new web3.eth.Contract(RelayedJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAYED"]));
        relay = new web3.eth.Contract(RelayJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAY"]));

        accounts = [];
        for (let i = 0; i < web3.eth.accounts.wallet.length; i++) {
            accounts.push(web3.utils.toChecksumAddress(web3.eth.accounts.wallet[i].address));
        }

        for (let i = 0; i < initialValidators.length; i++) {
            initialValidators[i] = web3.utils.toChecksumAddress(initialValidators[i]);
        }
        
        for (let i = 0; i < testValidators.length; i++) {
            testValidators[i] = web3.utils.toChecksumAddress(testValidators[i]);
        }
    });

    after(async () => {
    
    await web3.currentProvider.connection.close()
    console.log('connection closed')
    })

    describe("#setRelayed", async function () {

        beforeEach(async function () {
            (await relay.methods.relayedSet().call()).should.be.equal(relayed.address);
        });

        afterEach(async function () {
            (await relay.methods.relayedSet().call()).should.be.equal(relayed.address);
        });

        it('should allow only the owner to set relayed address', async function () {
            await expect(relay.methods.setRelayed(web3.eth.accounts.wallet.accounts['2'].address).send({ from: web3.eth.accounts.wallet.accounts['2'].address, gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(web3.eth.accounts.wallet.accounts['2'].address);

            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(relayed.address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;
        });

        it('should set relayed address correctly', async function () {
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
                },
                relay.address,
                1
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(web3.eth.accounts.wallet.accounts['2'].address);

            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(relayed.address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;
        });

        it('should not allow to set it to the same relayed address', async function () {    
            const logs = await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(relayed.address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;
            should.exist(logs.events['ExecutionFailure']);
        });

        it('should emit event', async function () {
             await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
                },
                relay.address,
                1
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(web3.eth.accounts.wallet.accounts['2'].address);

            let logs = await relay.getPastEvents('NewRelayed', {
                fromBlock: await web3.eth.getBlockNumber(),
                toBlock: 'latest'
            });
            logs[0].returnValues.old.should.be.deep.equal(relayed.address);
            logs[0].returnValues.current.should.be.deep.equal(web3.eth.accounts.wallet.accounts['2'].address);

            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(relayed.address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(relayed.address);

            logs = await relay.getPastEvents('NewRelayed', {
                fromBlock: await web3.eth.getBlockNumber(),
                toBlock: 'latest'
            });
            logs[0].returnValues.old.should.be.deep.equal(web3.eth.accounts.wallet.accounts['2'].address);
            logs[0].returnValues.current.should.be.deep.equal(relayed.address);
        });
    });

    describe("#setSystem", async function () {

        beforeEach(async function () {
            (await relay.methods.SYSTEM_ADDRESS().call()).should.be.equal(SYSTEM_ADDRESS);
        });

        afterEach(async function () {
            (await relay.methods.SYSTEM_ADDRESS().call()).should.be.equal(SYSTEM_ADDRESS);
        });

        it('should allow only the owner to set system address', async function () {
            await expect(relay.methods.setSystem( web3.eth.accounts.wallet.accounts['2'].address).send({ from: web3.eth.accounts.wallet.accounts['2'].address, gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
        
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setSystem(web3.eth.accounts.wallet.accounts['2'].address).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;

            (await relay.methods.SYSTEM_ADDRESS().call()).should.be.equal(web3.eth.accounts.wallet.accounts['2'].address);

            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setSystem(SYSTEM_ADDRESS).encodeABI()
                },
                relay.address,
                1
            ).should.be.fulfilled;
        });

        it('should not allow to set the system address to 0x0', async function () {
            const logs = await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setSystem(DEFAULT_ADDRESS).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;
            should.exist(logs.events['ExecutionFailure']);
        });

        it('should not allow to set the system address to the already existing one', async function () {
            const logs = await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setSystem(SYSTEM_ADDRESS).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;
            should.exist(logs.events['ExecutionFailure']);
        });
    });

    describe("#getValidators", async function () {

        this.timeout(600000);

        it('should return the correct validators', async function () {
            let currentValidators = await relay.methods.getValidators().call();
            currentValidators.should.have.members(initialValidators);

        });
    });

    describe('#finalizeChange', async function () {
        this.timeout(300000);
    
        it('system should set finalized to true', async function () {
          (await relayed.methods.finalized().call()).should.be.true;
          const txA = { 
              value: '0', 
              data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, ChainspecValues.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.finalized().call()).should.be.false;
          await utils.waitForSomething([
            {execute: relayed.methods.isActiveValidator(utils.testValidators[0]).call, waitUntil: true },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);
          
          (await relayed.methods.finalized().call()).should.be.true;
    
          const txB = { 
              value: '0', 
              data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, ChainspecValues.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.finalized().call()).should.be.false;
          
          await utils.waitForSomething([
            {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);
    
          (await relayed.methods.finalized().call()).should.be.true;
          
        });
    
        it('should set currentValidators to pendingValidators after addValidator call', async function () {
          (await relayed.methods.finalized().call()).should.be.true;
          const txA = { 
              value: '0', 
              data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, ChainspecValues.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())
         
          await utils.waitForSomething([
            {execute: relayed.methods.isActiveValidator(utils.testValidators[0]).call, waitUntil: true },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);
          
          (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())
    
          const txB = { 
              value: '0', 
              data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
          };
          await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, ChainspecValues.address_book["VALIDATOR_RELAYED"] );
          (await relayed.methods.getValidators().call()).should.not.be.deep.equal(await relayed.methods.getPendingValidators().call())
          
          await utils.waitForSomething([
            {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
            {execute: relayed.methods.finalized().call, waitUntil: true}
          ]);
          
          (await relayed.methods.getValidators().call()).should.be.deep.equal(await relayed.methods.getPendingValidators().call())
        });
    });

    describe("#callbackInitiateChange", async function () {

        it('should allow to be called only by relayed contract', async function () {

            await expect(relay.methods.callbackInitiateChange("0x0", []).send({ from: web3.eth.accounts.wallet.accounts['2'].address }))
                .to.be.rejectedWith(utils.PARITY_REVERT_MSG)
        });

        it('should emit event correctly', async function () {
            await utils.sleep(5000);
            const validators = [
                ...((await relayed.methods.getValidators().call()).map(address => address.toLowerCase())),
                utils.testValidators[0].toLowerCase()
            ];
            const txA = { 
                value: '0', 
                data: relayed.methods.addValidator(utils.testValidators[0]).encodeABI()
            };
            const receipt = await utils.sendMultisigTransaction(web3, netOpsMultiSig, txA, ChainspecValues.address_book["VALIDATOR_RELAYED"] );

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
                {execute: relayed.methods.isActiveValidator(utils.testValidators[0]).call, waitUntil: true} ,
                {execute: relayed.methods.finalized().call, waitUntil: true}
            ]);
            
            const txB = { 
                value: '0', 
                data: relayed.methods.removeValidator(utils.testValidators[0]).encodeABI()
            };
            await utils.sendMultisigTransaction(web3, netOpsMultiSig, txB, ChainspecValues.address_book["VALIDATOR_RELAYED"] );
            
            await utils.waitForSomething([
                {execute: relayed.methods.isPendingToBeRemoved(utils.testValidators[0]).call, waitUntil: false },
                {execute: relayed.methods.finalized().call, waitUntil: true}
            ]);
            
        });
        
    });
    
});

async function callBackWithEvent(_bHash, _vals, options) {
    const _result = await relayed.triggerRelayCallbackWithEvent(_bHash, _vals, options).should.be.fulfilled;
    _result.logs[0].event.should.be.equal("CallbackSuccess");
    return _result;
}

async function forFinalization() {
    let finalized = false;
    while (!finalized) {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, 5000);
        });
        finalized = await relayed.methods.finalized().call();
        console.log(finalized)
    }
}