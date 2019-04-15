
const BN = require('bn.js');
require('chai')
    .use(require('chai-as-promised'))
    .should();
const expect = require('chai').expect;

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
    testPayoutAddresses,
    TestSCurveProvder
} = require(__dirname + "/utils.js");

const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
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

    // hope these not break the chain, otherwise big oof
    describe("#setRelayed", async function () {

        beforeEach(async function () {
            (await relay.methods.relayedSet().call()).should.be.equal(relayed.address);
        });

        afterEach(async function () {
            (await relay.methods.relayedSet().call()).should.be.equal(relayed.address);
        });

        xit('should allow only the owner to set relayed address', async function () {
            await expect(relay.methods.setRelayed(accounts[0]).send({ from: accounts[0], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            await expect(relay.methods.setRelayed(accounts[1]).send({ from: accounts[1], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(accounts[0]).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(accounts[0]);

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

        xit('should set relayed address correctly', async function () {
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(accounts[1]).encodeABI()
                },
                relay.address,
                1
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(accounts[1]);

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

        xit('should not allow to set it to the same relayed address', async function () {    
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

        xit('should emit event', async function () {
             await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setRelayed(accounts[0]).encodeABI()
                },
                relay.address,
                1
            ).should.be.fulfilled;

            (await relay.methods.relayedSet().call()).should.be.equal(accounts[0]);

            let logs = await relay.getPastEvents('NewRelayed', {
                fromBlock: await web3.eth.getBlockNumber(),
                toBlock: 'latest'
            });
            logs[0].returnValues.old.should.be.deep.equal(relayed.address);
            logs[0].returnValues.current.should.be.deep.equal(accounts[0]);

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
            logs[0].returnValues.old.should.be.deep.equal(accounts[0]);
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

        xit('should allow only the owner to set system address', async function () {
            await expect(relay.methods.setSystem(accounts[0]).send({ from: accounts[1], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            await expect(relay.methods.setSystem(accounts[1]).send({ from: accounts[0], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);

            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relay.methods.setSystem(accounts[1]).encodeABI()
                },
                relay.address,
                0
            ).should.be.fulfilled;

            (await relay.methods.SYSTEM_ADDRESS().call()).should.be.equal(accounts[1]);

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

        xit('should not allow to set the system address to 0x0', async function () {
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

        xit('should not allow to set the system address to the already existing one', async function () {
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
            currentValidators.should.be.deep.equal(initialValidators);

            console.log(testValidators[0])
            console.log(relayed.address)
            console.log(await relayed.methods.owner().call(), netOpsMultiSig.address)
            console.log(relayed.methods.addValidator(testValidators[0]).encodeABI())
            let logs = await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relayed.methods.addValidator(testValidators[0]).encodeABI()
                },
                relayed.address,
                0
            ).should.be.fulfilled;
            console.log(logs)
            should.exist(logs.events['Execution']);
            console.log(1);
            await forFinalization();
            (await relay.methods.getValidators().call()).should.be.deep.equal(initialValidators.concat([testValidators[0]]));
            console.log(2);
            await sendMultisigTransaction(
                web3,
                netOpsMultiSig,
                {
                    value: 0,
                    data: relayed.methods.removeValidator(testValidators[0]).encodeABI()
                },
                relayed.address,
                1
            ).should.be.fulfilled;
            console.log(logs);
            should.exist(logs.events['Execution']);
            console.log(3);
            await forFinalization();
            console.log(4);
            (await relay.methods.getValidators().call()).should.be.deep.equal(currentValidators);

            await expect(relayed.addValidator(accounts[1]).send({ from: accounts[1], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.methods.getValidators().call()).should.be.deep.equal(currentValidators);

            await expect(relayed.removeValidator(initialValidators[0]).send({ from: accounts[0], gas: standardGas }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.methods.getValidators().call()).should.be.deep.equal(currentValidators);

            console.log(5);
            let currentValidatorsLength = await relayed.getValidatorsNum().call();
            currentValidatorsLength.toNumber(10).should.equal(initialValidators.length);
        });
    });

    describe('#finalizeChange', async function () {
/*
        beforeEach(async function () {
            await relayed.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should only be callable by system', async function () {
            await relay.methods.finalizeChange({ from: accounts[5] }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.methods.finalizeChange({ from: owner }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should set finalized to true', async function () {
            let finalized = await relayed.finalized().call();
            finalized.should.be.false;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
            finalized = await relayed.finalized().call();
            finalized.should.be.true;
        });

        it('should set currentValidators to pendingValidators in relayed', async function () {
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators().call();
            let pendingValidators = await relayed.getPendingValidators().call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relayed.getPastEvents(
                "ChangeFinalized",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.validatorSet.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after addValidator call', async function () {
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3]).send({ from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators().call();
            let pendingValidators = await relayed.getPendingValidators().call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.addValidator(accounts[4]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators().call();
            pendingValidators = await relayed.getPendingValidators().call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3], accounts[4]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after removeValidator call', async function () {
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.removeValidator(accounts[2]).send({ from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            let currentValidators;
            let pendingValidators;
            for (let i = 1; i <= 3; i++) {
                await relayed.removeValidator(accounts[i]).send({ from: owner }).should.be.fulfilled;
                await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;

                currentValidators = await relayed.getValidators().call();
                pendingValidators = await relayed.getPendingValidators().call();
                currentValidators.should.be.deep.equal(pendingValidators);
            }
            const expected = [];
            pendingValidators.should.be.deep.equal(expected);
            currentValidators.should.be.deep.equal(expected);
        });
    });

    describe("#callbackInitiateChange", async function () {

        it('should allow to be called only by relayed contract', async function () {
            await relay.methods.callbackInitiateChange("0x0", []).send({ from: owner }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.methods.callbackInitiateChange("0x0", []).send({ from: system }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.methods.callbackInitiateChange("0x0", []).send({ from: accounts[2] }).should.be.rejectedWith(NOT_RELAYED_ERROR);

            await callBackWithEvent("0x0", []).send({ from: owner }).should.be.fulfilled;
        });

        it('should emit event correctly', async function () {
            const expected = [EMPTY_BYTES32, []];
            await callBackWithEvent(expected[0], expected[1]).send({ from: owner }).should.be.fulfilled;

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.methods.getPastEvents(
                "InitiateChange",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args._parentHash.should.be.equal(expected[0]);
            events[0].args._newSet.should.be.deep.equal(expected[1]);
        });
    });

    describe('#reportMalicious', async function () {

        async function checkMaliciousEvent(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.getPastEvents(
                "ReportedMalicious",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events[0].args.reporter.should.be.equal(expected.reporter);
            events[0].args.reported.should.be.equal(expected.reported);
            events[0].args.blocknum.toNumber(10).should.be.equal(expected.blocknum);
        }

        beforeEach(async function () {
            await relayed.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[1] }).should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should only be called by an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportMalicious(accounts[1], bn + 1, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.reportMalicious(accounts[1], bn + 2, "0x0").send({ from: accounts[4] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.methods.reportMalicious(accounts[2], bn + 3, "0x0").send({ from: accounts[3] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportMalicious(accounts[1], bn + 1, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.reportMalicious(accounts[3], bn + 2, "0x0").send({ from: accounts[1] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.methods.reportMalicious(accounts[4], bn + 3, "0x0").send({ from: accounts[2] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn - 1, "0x0").send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportMalicious(accounts[1], bn, "0x0").send({ from: accounts[2] }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relay.methods.reportMalicious(accounts[2], (await web3.eth.getBlockNumber()) + 1, "0x0").send({ from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.reportMalicious(accounts[1], (await web3.eth.getBlockNumber()) + 100, "0x0").send({ from: accounts[2] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit the event correctly', async function () {
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[1], bn, "0x0").send({ from: accounts[2] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[2],
                reported: accounts[1],
                blocknum: bn
            });

            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0123456789abcdef").send({ from: accounts[1] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[3], bn, "0x0").send({ from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[3], bn, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe('#reportBenign', async function () {

        async function checkBenign(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.getPastEvents(
                "ReportedBenign",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events[0].args.reporter.should.be.equal(expected.reporter);
            events[0].args.reported.should.be.equal(expected.reported);
            events[0].args.blocknum.toNumber(10).should.be.equal(expected.blocknum);
        }

        beforeEach(async function () {
            await relayed.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[1] }).should.be.fulfilled;
            await checkBenign({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should only be called by an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportBenign(accounts[1], bn + 1).send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.reportBenign(accounts[1], bn + 2).send({ from: accounts[4] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.methods.reportBenign(accounts[2], bn + 3).send({ from: accounts[3] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportBenign(accounts[1], bn + 1).send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.reportBenign(accounts[3], bn + 2).send({ from: accounts[1] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.methods.reportBenign(accounts[4], bn + 3).send({ from: accounts[2] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn - 1).send({ from: accounts[1] }).should.be.fulfilled;
            await relay.methods.reportBenign(accounts[1], bn).send({ from: accounts[2] }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relay.methods.reportBenign(accounts[2], (await web3.eth.getBlockNumber()) + 1).send({ from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.reportBenign(accounts[1], (await web3.eth.getBlockNumber()) + 100).send({ from: accounts[2] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit the event correctly', async function () {
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[1], bn).send({ from: accounts[2] })
                .should.be.fulfilled;
            await checkBenign({
                reporter: accounts[2],
                reported: accounts[1],
                blocknum: bn
            });

            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[1] })
                .should.be.fulfilled;
            await checkBenign({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[3], bn).send({ from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[3], bn).send({ from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
*/
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