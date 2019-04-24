/*
const fs = require("fs");
const RelayedJSON = JSON.parse(
        fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/ValidatorSetRelayed.json")
);
const RelayJSON = JSON.parse(
        fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/ValidatorSetRelay.json")
);

const {
    ChainspecValues,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32,
    ValidatorState,
    MultiSigWalletJSON,
    web3
} = require(__dirname + "/utils.js");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();


let owner;
let relay;
let relayed;
let netOpsMultiSig;
let accounts;
/*
// transaction should have a data and value fields
async function sendMultisigTransaction(multisig, transaction, submitterWalletPosition = 0, confirmTransaction = {}) {
    let amount = transaction["value"] ? web3.utils.toWei(transaction.value) : 0;
    
    const submitter = web3.eth.accounts.wallet[submitterWalletPosition].address;
    const confirmer = submitterWalletPosition == 0 ? web3.eth.accounts.wallet[1].address: web3.eth.accounts.wallet[submitterWalletPosition].address;
    
    const {logs} = await multisig.submitTransaction.sendTransaction(submitter, amount, transaction.data).send({ from: submitter });
    const transactionID = logs[0].args.transactionId;

    confirmTransaction["from"] = confirmer;
    return multisig.confirmTransaction(transactionID).send(confirmTransaction);
}

/*
describe("#setSystem", async function () {

        it('should allow only the owner to set system address', async function () {
            await relay.setSystem(accounts[2]).send({ from: system }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.setSystem(accounts[2]).send({ from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.setSystem(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should not allow to set the system address to 0x0', async function () {
            await relay.setSystem(DEFAULT_ADDRESS).send({ from: owner }).should.be.rejectedWith(ADDRESS_ZERO_ERROR);
            await relay.setSystem(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should not allow to set the system address to the already existing one', async function () {
            await relay.setSystem(system).send({ from: owner }).should.be.rejectedWith(SYSTEM_SAME_ERROR);
        });
});

describe('Validator set', function () {

    this.timeout(25000);

    before(async function () {
        netOpsMultiSig = new web3.eth.Contract(MultiSigWalletJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_NETOPS"]));
        owner = web3.utils.toChecksumAddress(netOpsMultiSig.options.address);
        relay = new web3.eth.Contract(RelayJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAY"]));
        relayed = new web3.eth.Contract(RelayedJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAYED"]));

        accounts = [];
        for (let i = 0; i < web3.eth.accounts.wallet.length; i++) {
            accounts.push(web3.utils.toChecksumAddress(web3.eth.accounts.wallet[i].address));
        }
    });

    describe("#getValidatorsNum", async function () {

        it('should return the correct validators number', async function () {
            let currentValidators = await relayed.methods.getValidators().call();
            let currentValidatorsLength = await relayed.methods.getValidatorsNum().call();
            console.log(currentValidatorsLength);
            currentValidatorsLength.toNumber(10).should.be.equal(currentValidators.length);
        });
    });

     describe('#addValidator', async function () {

        it('should only be callable by owner', async function () {
            await relayed.methods.addValidator(accounts[1]).send({ from: accounts[1], gas: 1000000 }).should.be.rejectedWith(REVERT_ERROR_MSG);
            //await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            //const expected = [accounts[1], accounts[2]];
            //await checkPendingValidators(expected);
        });
    });

    describe("#setRelay", async function () {

        it('should be called successfully by owner', async function () {
            await relayed.methods.setRelay(owner).send({ from: owner }).should.be.fulfilled;
            let relayaddress = await relayed.methods.relaySet().call();
            relayaddress.should.equal(owner);
        });

        it('should emit event on success', async function () {
            const { logs } = await relayed.methods.setRelay(owner).send({ from: owner }).should.be.fulfilled;
            logs[0].event.should.be.equal("NewRelay");
            logs[0].args.relay.should.be.equal(owner);
        });

        it('should not be able to set it to 0x0', async function () {
            let relayaddress = await relayed.methods.relaySet.call();
            await relayed.methods.setRelay(DEFAULT_ADDRESS).send({ from: owner, gas: 1000000 }).should.be.rejectedWith(REVERT_ERROR_MSG);
            let relayaddressAgain = await relayed.methods.relaySet().call();
            relayaddressAgain.should.equal(relayaddress);
        });

        it('should be only callable by owner', async function () {
            await relayed.methods.setRelay(accounts[0]).send({ from: accounts[0] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.methods.setRelay(accounts[1]).send({ from: accounts[0] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.methods.setRelay(accounts[1]).send({ from: owner }).should.be.fulfilled;
            let relayaddress = await relayed.methods.relaySet.call();
            relayaddress.should.equal(accounts[1]);
        });

        it('should not allow same as the old one', async function () {
            await relayed.methods.setRelay(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await relayed.methods.setRelay(accounts[1]).send({ from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            let relayaddress = await relayed.methods.relaySet.call();
            relayaddress.should.equal(accounts[1]);
        });
    });

    describe("#setRelayed", async function () {

        it('should allow only the owner to set relayed address', async function () {
            await relay.methods.setRelayed(accounts[2]).send({ from: system }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.setRelayed(accounts[2]).send({ from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(accounts[2]);
        });

        it('should set relayed address correctly', async function () {
            await relay.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(accounts[2]);
            await relay.setRelayed(relayedAddress).send({ from: owner }).should.be.fulfilled;
            (await relay.relayedSet.call()).should.be.equal(relayedAddress);
        });

        it('should not allow to set it to the same relayed address', async function () {
            await relay.setRelayed(relayedAddress).send({ from: owner }).should.be.rejectedWith(RELAYED_SAME_ERROR);
        });

        it('should emit event', async function () {
            let { logs } = await relay.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(relayedAddress);
            logs[0].args.current.should.be.deep.equal(accounts[2]);

            let tr = await relay.methods.setRelayed(accounts[3]).send({ from: owner }).should.be.fulfilled;
            logs = tr.logs;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(accounts[2]);
            logs[0].args.current.should.be.deep.equal(accounts[3]);
        });
    });

    describe('#finalizeChange', async function () {

        beforeEach(async function() {
            await relayed.addValidator(accounts[2], {from: owner}).should.be.fulfilled;
        });

        it('should only be callable by system', async function () {
            await relay.finalizeChange({ from: accounts[5] }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.finalizeChange({ from: owner }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should set finalized to true', async function () {
            let finalized = await relayed.finalized.call();
            finalized.should.be.false;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            finalized = await relayed.finalized.call();
            finalized.should.be.true;
        });

        it('should set currentValidators to pendingValidators in relayed', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
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
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3], { from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.getValidators.call();
            let pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.addValidator(accounts[4], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.getValidators.call();
            pendingValidators = await relayed.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3], accounts[4]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after removeValidator call', async function () {
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;

            await relayed.removeValidator(accounts[2], { from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            
            let currentValidators;
            let pendingValidators;
            for(let i = 1; i <= 3; i++) {
                await relayed.removeValidator(accounts[i], { from: owner }).should.be.fulfilled;
                await relay.finalizeChange({ from: system }).should.be.fulfilled;

                currentValidators = await relayed.getValidators.call();
                pendingValidators = await relayed.getPendingValidators.call();
                currentValidators.should.be.deep.equal(pendingValidators);
            }
            const expected = [];
            pendingValidators.should.be.deep.equal(expected);
            currentValidators.should.be.deep.equal(expected);
        });
    });

    describe("#callbackInitiateChange", async function () {

        it('should allow to be called only by relayed contract', async function () {
            await relay.callbackInitiateChange("0x0", [], { from: owner }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.callbackInitiateChange("0x0", [], { from: system }).should.be.rejectedWith(NOT_RELAYED_ERROR);
            await relay.callbackInitiateChange("0x0", [], { from: accounts[2] }).should.be.rejectedWith(NOT_RELAYED_ERROR);

            await callBackWithEvent("0x0", [], { from: owner }).should.be.fulfilled;
        });

        it('should emit event correctly', async function () {
            const expected = [EMPTY_BYTES32, []];
            await callBackWithEvent(expected[0], expected[1], { from: owner }).should.be.fulfilled;

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.getPastEvents(
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
            await relayed.addValidator(accounts[2], { from: owner }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
        });

        it('should be called successfully', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should only be called by an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 1, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 2, "0x0", { from: accounts[4] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportMalicious(accounts[2], bn + 3, "0x0", { from: accounts[3] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on an active validator', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn + 1, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[3], bn + 2, "0x0", { from: accounts[1] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relay.reportMalicious(accounts[4], bn + 3, "0x0", { from: accounts[2] }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be called on existing block number', async function () {
            const bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn - 1, "0x0", { from: accounts[1] }).should.be.fulfilled;
            await relay.reportMalicious(accounts[1], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;

            // works with BLOCKNUM_NOT_VALID_ERROR too in tests, but for some magical reason fails in solidity-coverage
            await relay.reportMalicious(accounts[2], (await web3.eth.getBlockNumber()) + 1, "0x0", { from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.reportMalicious(accounts[1], (await web3.eth.getBlockNumber()) + 100, "0x0", { from: accounts[2] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
        });

        it('should emit the event correctly', async function () {
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[1], bn, "0x0", { from: accounts[2] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[2],
                reported: accounts[1],
                blocknum: bn
            });

            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0123456789abcdef", { from: accounts[1] })
                .should.be.fulfilled;
            await checkMaliciousEvent({
                reporter: accounts[1],
                reported: accounts[2],
                blocknum: bn
            });
        });

        it('should not accept report on a pending-to-be-added validator', async function () {
            await relayed.addValidator(accounts[3], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[3], bn, "0x0", { from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[3], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.removeValidator(accounts[2], { from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[2] }).should.be.fulfilled;
            await relay.finalizeChange({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.reportMalicious(accounts[2], bn, "0x0", { from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

        //yes
        it('should not allow to add already active validator', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[1]).send({ from: owner }).should.be.rejectedWith(VALIDATOR_ACTIVE_ERROR);
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(VALIDATOR_ACTIVE_ERROR);
        });

        it('should not allow to add if not finalized', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
        });

        it('should not allow to add 0x0 addresses', async function () {
            await relayed.methods.addValidator(DEFAULT_ADDRESS).send({ from: owner }).should.be.rejectedWith(VALIDATOR_ADDRESS_ZERO_ERROR);
        });

        it('should set addressStatus for new validator correctly', async function () {
            let status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.NonValidator);
            status[1].should.be.bignumber.equal("0");

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;

            status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.PendingToBeAdded);
            status[1].should.be.bignumber.equal("0");

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.FinalizedValidator);
            status[1].should.be.bignumber.equal("1");
        });
        //yes
        it('should not be finalized before finalize call', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let finalized = await relayed.methods.finalized.call();
            finalized.should.be.false;
        });

        it('should update the pending set', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await checkPendingValidators([accounts[1], accounts[2]]);
        });

        xit('should not change the current validator set', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await checkCurrentValidators([accounts[1]]);
        });

        xit('should emit InitiateChange in relay with correct blockhash and pendingValidators', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let currentValidators = await relayed.methods.getValidators.call();
            currentValidators.push(accounts[2]);
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const parent = await web3.eth.getBlock(currentBlocknumber - 1);
            const events = await relay.methods.getPastEvents(
                "InitiateChange",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );

            events.length.should.equal(1);
            events[0].args._parentHash.should.be.equal(parent.hash);
            events[0].args._newSet.should.be.deep.equal(currentValidators);

            let finalized = await relayed.methods.finalized.call();
            finalized.should.be.false;
        });
    });


    describe('#finalizeChange', async function () {

        beforeEach(async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should only be callable by the relay address', async function () {
            await relayed.methods.setRelay(owner).send({ from: owner }).should.be.fulfilled;
            relayAddress = owner;

            await relayed.methods.finalizeChange().send({ from: accounts[5] }).should.be.rejectedWith(NOT_RELAY_ERROR);
            await relayed.methods.finalizeChange().send({ from: relayAddress }).should.be.fulfilled;
        });

        //maybe
        it('should only be callable if changes are not finalized yet', async function () {
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);

            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);

            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.rejectedWith(FINALIZED_ERROR);
        });

        //maybe
        it('should set finalized to true', async function () {
            await relayed.methods.setRelay(owner).send({ from: owner }).should.be.fulfilled;
            relayAddress = owner;

            let finalized = await relayed.methods.finalized.call();
            finalized.should.be.false;
            await relayed.methods.finalizeChange().send({ from: relayAddress }).should.be.fulfilled;
            finalized = await relayed.methods.finalized.call();
            finalized.should.be.true;
        });

        // yes, in general i guess
        it('should set currentValidators to pendingValidators after constructor', async function () {
            await relayed.methods.setRelay(owner).send({ from: owner }).should.be.fulfilled;
            relayAddress = owner;

            const { logs } = await relayed.methods.finalizeChange().send({ from: relayAddress }).should.be.fulfilled;
            let currentValidators = await relayed.methods.getValidators.call();
            let pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);
            logs[0].event.should.be.equal('ChangeFinalized');
            logs[0].args.validatorSet.should.be.deep.equal(currentValidators);
        });

        // maybe yes if not too long
        it('should set currentValidators to pendingValidators after addValidator call', async function () {
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[3]).send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.methods.getValidators.call();
            let pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.methods.addValidator(accounts[4]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.methods.getValidators.call();
            pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3], accounts[4]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        // maybe yes, if not too long
        it('should set currentValidators to pendingValidators after removeValidator call', async function () {
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            await relayed.methods.removeValidator(accounts[3]).send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);

            let currentValidators;
            let pendingValidators;
            for (let i = 1; i <= 3; i++) {
                await relayed.methods.removeValidator(accounts[i]).send({ from: owner }).should.be.fulfilled;
                await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

                currentValidators = await relayed.methods.getValidators.call();
                pendingValidators = await relayed.methods.getPendingValidators.call();
                currentValidators.should.be.deep.equal(pendingValidators);
            }
            const expected = [];
            pendingValidators.should.be.deep.equal(expected);
            currentValidators.should.be.deep.equal(expected);
        });
    });

    //yes
   
    //yes
    describe('#removeValidator', async function () {

        it('should remove validator', async function () {
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await checkCurrentValidators([]);
        });

        it('should not try to remove from empty pending list', async function () {
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
        });

        it('should only be callable by owner', async function () {
            await relayed.methods.removeValidator(accounts[1]).send({ from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: accounts[1] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await checkCurrentValidators([accounts[2]])
        });

        it('should only be allowed to remove from existing set of validators', async function () {
            await relayed.methods.removeValidator(accounts[6]).send({ from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.methods.removeValidator(DEFAULT_ADDRESS).send({ from: owner }).should.be.rejectedWith(NOT_VALIDATOR_ERROR);
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should not allow to remove if not finalized', async function () {
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(NOT_FINALIZED_ERROR);
        });

        it('should allow remove after a failed remove', async function () {
            await relayed.methods.removeValidator(accounts[1]).send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            await checkPendingValidators([]);
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await checkCurrentValidators([]);
            await checkPendingValidators([]);
        });

        it('should change pending set correctly', async function () {
            await checkPendingValidators([accounts[1]]);
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await checkPendingValidators([accounts[1], accounts[2], accounts[3]]);

            let pendingValidators = await relayed.methods.getPendingValidators.call();
            let currentValidatorsLength = await relayed.methods.getValidatorsNum.call();

            const indexOfRemovedElement = pendingValidators.indexOf(accounts[1]);
            pendingValidators[indexOfRemovedElement] = pendingValidators.pop()

            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;

            let newPendingValidators = await relayed.methods.getPendingValidators.call();
            newPendingValidators.length.should.be.equal(currentValidatorsLength.toNumber(10) - 1);
            pendingValidators.should.be.deep.equal(newPendingValidators);

            const expected = [accounts[3], accounts[2]];
            expected.should.be.deep.equal(pendingValidators);

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.getPendingValidators.call()).should.be.deep.equal(expected);
        });

        it('should change current set correctly', async function () {
            await checkCurrentValidators([accounts[1]]);

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            await checkCurrentValidators([accounts[1], accounts[2], accounts[3]]);

            let currentValidators = await relayed.methods.getValidators.call();
            let currentValidatorsLength = await relayed.methods.getValidatorsNum.call();

            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;

            let pendingValidators = await relayed.methods.getPendingValidators.call();
            await checkCurrentValidators(currentValidators);
            currentValidatorsLength.toNumber(10).should.be.equal((await relayed.methods.getValidatorsNum.call()).toNumber(10));

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            currentValidators = await relayed.methods.getValidators.call();

            pendingValidators.should.be.deep.equal(currentValidators);

            const expected = [accounts[3], accounts[2]];
            expected.should.be.deep.equal(currentValidators);
        });

        it('should change address status correctly', async function () {
            let status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.NonValidator);
            status[1].should.be.bignumber.equal("0");

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;

            status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.PendingToBeRemoved);
            status[1].should.be.bignumber.equal("1");

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            status = await relayed.methods.addressStatus.call(accounts[2]);
            status[0].should.be.bignumber.equal(ValidatorState.NonValidator);
            status[1].should.be.bignumber.equal("0");
        });

        it('should set finalized to false', async function () {
            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            const finalized = await relayed.methods.finalized.call();
            finalized.should.be.false;
        });
    });

    describe('#isPendingToBeAdded', async function () {

        it('should return true only if address is pending to be added', async function () {
            (await relayed.methods.isPendingToBeAdded.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeAdded.call(accounts[2])).should.be.false;

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeAdded.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeAdded.call(accounts[2])).should.be.true;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeAdded.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeAdded.call(accounts[2])).should.be.false;

            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeAdded.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeAdded.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeAdded.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeAdded.call(accounts[2])).should.be.false;
        });
    });

    describe('#isPendingToBeRemoved', async function () {

        it('should return true only if address is pending to be removed', async function () {
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;

            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.true;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;

            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.true;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[1])).should.be.false;
            (await relayed.methods.isPendingToBeRemoved.call(accounts[2])).should.be.false;
        });
    });

    describe('#isActiveValidator', async function () {

        it('should return true for active (sealing) validators only', async function () {
            (await relayed.methods.isActiveValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isActiveValidator.call(accounts[2])).should.be.false;
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isActiveValidator.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isActiveValidator.call(accounts[2])).should.be.true;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isActiveValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isFinalizedValidator', async function () {

        it('should return true for finaized validators only', async function () {
            (await relayed.methods.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isFinalizedValidator.call(accounts[2])).should.be.false;

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isFinalizedValidator.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isFinalizedValidator.call(accounts[2])).should.be.true;

            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isFinalizedValidator.call(accounts[2])).should.be.false;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isFinalizedValidator.call(accounts[1])).should.be.true;
            (await relayed.methods.isFinalizedValidator.call(accounts[2])).should.be.false;
        });
    });

    describe('#isPending', async function () {

        it('returns true for pending-to-be-added/removed validators only', async function () {
            (await relayed.methods.isPending.call(accounts[1])).should.be.false;
            (await relayed.methods.addressStatus.call(accounts[1]))[0]
                .should.be.bignumber.equals(ValidatorState.FinalizedValidator);

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPending.call(accounts[2])).should.be.true;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPending.call(accounts[2])).should.be.false;

            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relayed.methods.isPending.call(accounts[2])).should.be.true;

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            (await relayed.methods.isPending.call(accounts[2])).should.be.false;
        });
    });


    // maybe
     describe('#reportMalicious', async function () {

        async function checkMaliciousEvent(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.methods.getPastEvents(
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
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
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
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[3], bn, "0x0").send({ from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[3], bn, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportMalicious(accounts[2], bn, "0x0").send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe('#reportBenign', async function () {

        async function checkBenign(expected) {
            currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relayed.methods.getPastEvents(
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
            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
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
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[3], bn).send({ from: accounts[1] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[3], bn).send({ from: accounts[2] }).should.be.fulfilled;
        });

        it('should accept report on a pending-to-be-removed validator', async function () {
            await relayed.methods.removeValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            let bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[2] }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            bn = await web3.eth.getBlockNumber();
            await relay.methods.reportBenign(accounts[2], bn).send({ from: accounts[2] }).should.be.rejectedWith(REVERT_ERROR_MSG);
        });
    });

    describe("#setRelayed", async function () {

        it('should allow only the owner to set relayed address', async function () {
            await relay.methods.methods.setRelayed(accounts[2]).send({ from: system }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.methods.setRelayed(accounts[2]).send({ from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relay.methods.relayedSet.call()).should.be.equal(accounts[2]);
        });

        it('should set relayed address correctly', async function () {
            await relay.methods.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relay.methods.relayedSet.call()).should.be.equal(accounts[2]);
            await relay.methods.setRelayed(relayedAddress).send({ from: owner }).should.be.fulfilled;
            (await relay.methods.relayedSet.call()).should.be.equal(relayedAddress);
        });

        it('should not allow to set it to the same relayed address', async function () {
            await relay.methods.setRelayed(relayedAddress).send({ from: owner }).should.be.rejectedWith(RELAYED_SAME_ERROR);
        });

        it('should emit event', async function () {
            let { logs } = await relay.methods.methods.setRelayed(accounts[2]).send({ from: owner }).should.be.fulfilled;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(relayedAddress);
            logs[0].args.current.should.be.deep.equal(accounts[2]);

            let tr = await relay.methods.methods.setRelayed(accounts[3]).send({ from: owner }).should.be.fulfilled;
            logs = tr.logs;

            logs[0].event.should.be.equal('NewRelayed');
            logs[0].args.old.should.be.deep.equal(accounts[2]);
            logs[0].args.current.should.be.deep.equal(accounts[3]);
        });
    });

    describe("#setSystem", async function () {

        it('should allow only the owner to set system address', async function () {
            await relay.methods.setSystem(accounts[2]).send({ from: system }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.setSystem(accounts[2]).send({ from: accounts[2] }).should.be.rejectedWith(NOT_OWNER_ERROR);
            await relay.methods.setSystem(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should not allow to set the system address to 0x0', async function () {
            await relay.methods.setSystem(DEFAULT_ADDRESS).send({ from: owner }).should.be.rejectedWith(ADDRESS_ZERO_ERROR);
            await relay.methods.setSystem(accounts[2]).send({ from: owner }).should.be.fulfilled;
        });

        it('should not allow to set the system address to the already existing one', async function () {
            await relay.methods.setSystem(system).send({ from: owner }).should.be.rejectedWith(SYSTEM_SAME_ERROR);
        });
    });

    describe("#getValidators", async function () {

        it('should return the correct validators', async function () {
            let currentValidators = await relay.methods.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[1]]);

            await relayed.methods.addValidator(accounts[2]).send({ from: owner }).should.be.fulfilled;
            (await relay.methods.getValidators.call()).should.be.deep.equal(currentValidators);

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            currentValidators = await relay.methods.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[1], accounts[2]]);


            await relayed.methods.removeValidator(accounts[1]).send({ from: owner }).should.be.fulfilled;
            (await relay.methods.getValidators.call()).should.be.deep.equal(currentValidators);

            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            currentValidators = await relay.methods.getValidators.call();
            currentValidators.should.be.deep.equal([accounts[2]]);

            await relayed.methods.addValidator(accounts[1]).send({ from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.methods.getValidators.call()).should.be.deep.equal(currentValidators);

            await relayed.methods.removeValidator(accounts[2]).send({ from: accounts[1] })
                .should.be.rejectedWith(REVERT_ERROR_MSG);
            (await relay.methods.getValidators.call()).should.be.deep.equal(currentValidators);

            let currentValidatorsLength = await relayed.methods.getValidatorsNum.call();
            currentValidatorsLength.toNumber(10).should.equal(currentValidators.length);
        });
    });

    describe('#finalizeChange', async function () {

        beforeEach(async function() {
            await relayed.methods.addValidator(accounts[2], {from: owner}).should.be.fulfilled;
        });

        it('should only be callable by system', async function () {
            await relay.methods.finalizeChange().send({ from: accounts[5] }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.methods.finalizeChange().send({ from: owner }).should.be.rejectedWith(NOT_SYSTEM_ERROR);
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
        });

        it('should set finalized to true', async function () {
            let finalized = await relayed.methods.finalized.call();
            finalized.should.be.false;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;
            finalized = await relayed.methods.finalized.call();
            finalized.should.be.true;
        });

        it('should set currentValidators to pendingValidators in relayed', async function () {
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.methods.getValidators.call();
            let pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relayed.methods.getPastEvents(
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
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            await relayed.methods.addValidator(accounts[3]).send({ from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            let currentValidators = await relayed.methods.getValidators.call();
            let pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            await relayed.methods.addValidator(accounts[4]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            currentValidators = await relayed.methods.getValidators.call();
            pendingValidators = await relayed.methods.getPendingValidators.call();
            currentValidators.should.be.deep.equal(pendingValidators);

            const expected = [accounts[1], accounts[2], accounts[3], accounts[4]];
            expected.should.be.deep.equal(pendingValidators);
            expected.should.be.deep.equal(currentValidators);
        });

        it('should set currentValidators to pendingValidators after removeValidator call', async function () {
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            await relayed.methods.addValidator(accounts[3]).send({ from: owner }).should.be.fulfilled;
            await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

            await relayed.methods.removeValidator(accounts[2]).send({ from: accounts[3] }).should.be.rejectedWith(REVERT_ERROR_MSG);
            
            let currentValidators;
            let pendingValidators;
            for(let i = 1; i <= 3; i++) {
                await relayed.methods.removeValidator(accounts[i]).send({ from: owner }).should.be.fulfilled;
                await relay.methods.finalizeChange().send({ from: system }).should.be.fulfilled;

                currentValidators = await relayed.methods.getValidators.call();
                pendingValidators = await relayed.methods.getPendingValidators.call();
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
            const expected = [EMPTY_BYTES32, []]
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

});

async function checkPendingValidators(expected) {
    const _pendingValidators = await relayed.methods.getPendingValidators.call();
    expected.should.be.deep.equal(_pendingValidators);
}

async function checkCurrentValidators(expected) {
    const _currentValidators = await relayed.methods.getValidators.call();
    expected.should.be.deep.equal(_currentValidators);
}
    */