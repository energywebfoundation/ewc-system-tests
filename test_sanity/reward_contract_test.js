
const BN = require('bn.js');
require('chai')
    .use(require('chai-as-promised'))
    .should();
const expect = require('chai').expect;

const {
    ChainspecValues,
    MultiSigWalletJSON,
    RelayedJSON,
    BlockRewardJSON,
    sendMultisigTransaction,
    addTestWallets,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    testValidators,
    testPayoutAddresses,
    TestSCurveProvder
} = require(__dirname + "/utils.js");

const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
//let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
let web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));

addTestWallets(web3);

describe("Reward contract", function () {

    this.timeout(120000);

    let owner;
    let rewardContract;
    let relayed;
    let netOpsMultiSig;
    let comFundMultiSig;
    let accounts;
    let curve;

    before(async function () {
        (await web3.eth.net.isListening()).should.be.true;
        web3.transactionConfirmationBlocks = 1;
        web3.eth.transactionConfirmationBlocks = 1;

        netOpsMultiSig = new web3.eth.Contract(MultiSigWalletJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_NETOPS"]));
        comFundMultiSig = new web3.eth.Contract(MultiSigWalletJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["COMMUNITY_FUND"]));
        owner = web3.utils.toChecksumAddress(netOpsMultiSig.address);

        rewardContract = new web3.eth.Contract(BlockRewardJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["REWARD"]));
        relayed = new web3.eth.Contract(RelayedJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAYED"]));

        accounts = [];
        for (let i = 0; i < web3.eth.accounts.wallet.length; i++) {
            accounts.push(web3.utils.toChecksumAddress(web3.eth.accounts.wallet[i].address));
        }

        curve = new TestSCurveProvder();
    });

    describe("#setCommunityFund", function () {

        async function setBackCommunityAddress() {
            let oldCfund = await rewardContract.methods.communityFund.call();
            if (oldCfund !== comFundMultiSig.address) {
                await expect(rewardContract.methods.setCommunityFund(comFundMultiSig.address).send({ from: oldCfund, gas: 50000 }))
                    .to.be.fulfilled;
                console.log("HAD TO SET COMMUNITY ADDRESSS TO DEFAULT");
            }
        }

        beforeEach(async function () {
            await setBackCommunityAddress();
            (await rewardContract.methods.communityFund.call()).should.be.equal(comFundMultiSig.address);
        });

        afterEach(async function () {
            await setBackCommunityAddress();
            (await rewardContract.methods.communityFund.call()).should.be.equal(comFundMultiSig.address);
        });

        it("should set community fund address correctly", async function () {
            console.log(await sendMultisigTransaction(
                web3,
                comFundMultiSig,
                {
                    value: 0,
                    data: rewardContract.methods.setCommunityFund(accounts[0]).encodeABI()
                },
                rewardContract.address,
                0
            ).should.be.fulfilled);

            (await rewardContract.methods.communityFund.call()).should.be.equal(accounts[0]);
            console.log(1)
            await expect(rewardContract.methods.setCommunityFund(comFundMultiSig.address).send({ from: accounts[0], gas: 50000 }))
                .to.be.fulfilled;
        });

        it("should allow only the community fund to set its own address", async function () {
            await expect(rewardContract.methods.setCommunityFund(accounts[0]).send({ from: accounts[0], gas: 500000 }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            await expect(rewardContract.methods.setCommunityFund(accounts[1]).send({ from: accounts[1], gas: 500000 }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);
            await expect(rewardContract.methods.setCommunityFund(owner).send({ from: accounts[1], gas: 500000 }))
                .to.be.rejectedWith(REVERT_ERROR_MSG);

            await sendMultisigTransaction(
                web3,
                comFundMultiSig,
                {
                    value: 0,
                    data: rewardContract.methods.setCommunityFund(accounts[1]).encodeABI()
                },
                rewardContract.address,
                1
            ).should.be.fulfilled;

            (await rewardContract.methods.communityFund.call()).should.be.equal(accounts[1]);

            await expect(rewardContract.methods.setCommunityFund(comFundMultiSig.address).send({ from: accounts[1], gas: 50000 }))
                .to.be.fulfilled;
        });

        // this test is omitted because it is irreversible
        xit("should allow the community fund to set the address to 0x0 (burn)", async function () {
            await sendMultisigTransaction(
                web3,
                comFundMultiSig,
                {
                    value: 0,
                    data: rewardContract.methods.setCommunityFund(DEFAULT_ADDRESS).enodeABI()
                },
                rewardContract.address,
                1
            ).should.be.fulfilled;
        });
    });

    describe("#setPayoutAddress", async function () {

        async function resetToDef() {
            for(let i=0; i<accounts.length; i++) {
                if (DEFAULT_ADDRESS != (await rewardContract.methods.payoutAddresses(accounts[i]).call())) {
                    await expect(rewardContract.methods.resetPayoutAddress().send({ from: accounts[i], gas: 500000 }))
                        .to.be.fulfilled;
                }
            }

            for(let i=0; i<testValidators.length; i++) {
                if (DEFAULT_ADDRESS != (await rewardContract.methods.payoutAddresses(testValidators[i]).call())) {
                    await expect(rewardContract.methods.resetPayoutAddress().send({ from: testValidators[i], gas: 500000 }))
                        .to.be.fulfilled;
                }
            }

            if (DEFAULT_ADDRESS != (await rewardContract.methods.payoutAddresses(comFundMultiSig.address).call())) {
                await sendMultisigTransaction(
                    web3,
                    comFundMultiSig,
                    {
                        value: 0,
                        data: rewardContract.methods.resetPayoutAddress().encodeABI()
                    },
                    rewardContract.address,
                    0
                ).should.be.fulfilled;
            }
        }

        async function checkDefValues() {
            (await rewardContract.methods.payoutAddresses(accounts[0]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(accounts[1]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[0]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[1]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[2]).call()).should.be.equal(DEFAULT_ADDRESS);
        }

        beforeEach(async function () {
            await resetToDef();
            await checkDefValues();
        });

        afterEach(async function () {
            await resetToDef();
            await checkDefValues();
        });

        it("should set payout addresses correctly", async function () {
            for (let i = 0; i < 2; i++) {
                await expect(rewardContract.methods.setPayoutAddress(testPayoutAddresses[i]).send({ from: accounts[i], gas: 500000 }))
                    .to.be.fulfilled;
            }

            for (let i = 0; i < 2; i++) {
                (await rewardContract.methods.payoutAddresses(accounts[i]).call())
                    .should.be.equal(testPayoutAddresses[i]);
            }

            for (let i = 0; i < 2; i++) {
                await expect(rewardContract.methods.setPayoutAddress(DEFAULT_ADDRESS).send({ from: accounts[i], gas: 500000 }))
                    .to.be.fulfilled;
            }
        });

        // right now I don't have access to our validator accounts
        xit("should set validator payout addresses correctly", async function () {
            for (let i = 0; i < testValidators.length; i++) {
                await expect(rewardContract.methods.setPayoutAddress(testPayoutAddresses[i]).send({ from: testValidators[i] }))
                    .to.be.fulfilled;
            }

            for (let i = 0; i < testValidators.length; i++) {
                (await rewardContract.methods.payoutAddresses.call(testValidators[i]))
                    .should.be.equal(testPayoutAddresses[i]);
            }

            for (let i = 0; i < testValidators.length; i++) {
                await expect(rewardContract.methods.setPayoutAddress(DEFAULT_ADDRESS).send({ from: testValidators[i] }))
                    .to.be.fulfilled;
            }
        });

        it("should allow to set payout address to 0x0", async function () {
            for (let i = 0; i < 2; i++) {
                await expect(rewardContract.methods.setPayoutAddress(DEFAULT_ADDRESS).send({ from: accounts[i], gas: 500000 }))
                    .to.be.fulfilled;
            }
        });

        it("should leave the payout addresses at 0x0 by default", async function () {
            for (let i = 0; i < testPayoutAddresses.length; i++) {
                (await rewardContract.methods.payoutAddresses(testPayoutAddresses[i]).call())
                    .should.be.equal(DEFAULT_ADDRESS);
            }
        });

        it("should always mint tokens for the community fund itself if its payout address is not specified", async function () {
            const cFund = await rewardContract.methods.communityFund().call();
            (await rewardContract.methods.payoutAddresses(cFund).call())
                .should.be.equal(DEFAULT_ADDRESS);

            let currentNum = await web3.eth.getBlockNumber();
            let currentAmount = await rewardContract.methods.mintedForAccount(cFund).call();
            let newNum = 0;
            let newAmount;
            while (newNum < currentNum + 1) {
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, 5000);
                });
                newNum = await web3.eth.getBlockNumber();
                newAmount = await rewardContract.methods.mintedForAccount(cFund).call();
            }
            let diff = newNum - currentNum;
            newAmount.toString(10).should.be.equal(
                new BN(currentAmount.toString(10)).add((new BN(ChainspecValues["balances"]["COMMUNITY_REWARD"])).muln(diff)).toString(10)
            );
        });

        it("should always mint tokens for the community fund's payout address if it is specified", async function () {
            const cFund = await rewardContract.methods.communityFund().call();

            await sendMultisigTransaction(
                web3,
                comFundMultiSig,
                {
                    value: 0,
                    data: rewardContract.methods.setPayoutAddress(accounts[1]).encodeABI()
                },
                rewardContract.address,
                0
            ).should.be.fulfilled;

            (await rewardContract.methods.payoutAddresses(cFund).call())
                .should.be.equal(accounts[1]);

            let currentNum = await web3.eth.getBlockNumber();
            let currentAmount = await rewardContract.methods.mintedForAccount(accounts[1]).call();
            let newNum = 0;
            let newAmount;
            while (newNum < currentNum + 1) {
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    }, 5000);
                });
                newNum = await web3.eth.getBlockNumber();
                newAmount = await rewardContract.methods.mintedForAccount(accounts[1]).call();
            }
            let diff = newNum - currentNum;
            newAmount.toString(10).should.be.equal(
                new BN(currentAmount.toString(10)).add((new BN(ChainspecValues["balances"]["COMMUNITY_REWARD"])).muln(diff)).toString(10)
            );

            await sendMultisigTransaction(
                web3,
                comFundMultiSig,
                {
                    value: 0,
                    data: rewardContract.methods.resetPayoutAddress().encodeABI()
                },
                rewardContract.address,
                0
            ).should.be.fulfilled;
        });
    });

    describe("#resetPayoutAddress", async function () {

        async function checkDefValues() {
            (await rewardContract.methods.payoutAddresses(accounts[0]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(accounts[1]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[0]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[1]).call()).should.be.equal(DEFAULT_ADDRESS);
            (await rewardContract.methods.payoutAddresses(testValidators[2]).call()).should.be.equal(DEFAULT_ADDRESS);
        }

        beforeEach(async function () {
            await checkDefValues();
        });

        afterEach(async function () {
            await checkDefValues();
        });

        it("should reset the payout address to 0x0", async function () {
            for (let i = 0; i < 2; i++) {
                await expect(rewardContract.methods.setPayoutAddress(testPayoutAddresses[i]).send({ from: accounts[i], gas: 500000 }))
                    .to.be.fulfilled;
            }

            for (let i = 0; i < 2; i++) {
                (await rewardContract.methods.payoutAddresses(accounts[i]).call())
                    .should.be.equal(testPayoutAddresses[i]);
            }

            for (let i = 0; i < 2; i++) {
                await expect(rewardContract.methods.resetPayoutAddress().send({ from: accounts[i], gas: 500000 }))
                    .to.be.fulfilled;
            }

            for (let i = 0; i < 2; i++) {
                (await rewardContract.methods.payoutAddresses(accounts[i]).call())
                    .should.be.equal(DEFAULT_ADDRESS);
            }
        });
    });

    describe("reward logging", function () {

        before(async function () {
            blockNumbersToTest = Math.min(300, await web3.eth.getBlockNumber());
        });

        it("should set TOTAL_MINTED correctly", async function () {

            let bnum = await web3.eth.getBlockNumber();
            let total = await rewardContract.methods.mintedTotally().call();
            let expected = new BN("0");
            for (let i = 0; i < bnum; i++) {
                expected.iadd(curve.calculateBlockReward(i).add(new BN(ChainspecValues["balances"]["COMMUNITY_REWARD"])));
            }
            total.toString(10).should.be.equal(expected.toString(10));
        });

        it("should set MINTED_FOR_COMMUNITY correctly", async function () {
            let bnum = await web3.eth.getBlockNumber();
            let totalCommunity = await rewardContract.methods.mintedForCommunity().call();
            let expected = new BN("0");
            for (let i = 0; i < bnum; i++) {
                expected.iadd(new BN(ChainspecValues["balances"]["COMMUNITY_REWARD"]));
            }
            totalCommunity.toString(10).should.be.equal(expected.toString(10));
        });
    });

    describe("#checkRewardPeriodEnded", async function () {

        it("should return false before the reward period", async function () {
            const expected = false;
            (await rewardContract.methods.checkRewardPeriodEnded().call()).should.be.equal(expected);
        });
    });

    describe("#getBlockReward", async function () {

        it("should return 0 on blocknumber 0", async function () {
            const expected = curve.calculateBlockReward(0);
            const actual = await rewardContract.methods.getBlockReward(0).call();
            actual.toString(10).should.be.equal(expected.toString(10));
        });

        it("should return 0 on blocknumber 63072000", async function () {
            const expected = curve.calculateBlockReward(63072000);
            const actual = await rewardContract.methods.getBlockReward(63072000).call();
            actual.toString(10).should.be.equal(expected.toString(10));
        });

        it("should return 0 on blocknumbers above 63072000", async function () {
            const expected = new BN("0");
            let actual;
            const max = curve.maxBlockNumReward.addn(30);
            for (let i = curve.maxBlockNumReward.clone(); i.lt(max); i.iaddn(1)) {
                actual = await rewardContract.methods.getBlockReward(i.toNumber(10)).call();
                actual.toString(10).should.be.equal(expected.toString(10));
            }
        });

        it("should return the correct values on edge cases", async function () {
            let expected;
            let actual;
            const max = curve.maxBlockNumReward;
            for (let i = new BN("0"); i.lt(max); i.iadd(curve.stepSize)) {
                expected = curve.calculateBlockReward(i);
                actual = await rewardContract.methods.getBlockReward(i.toNumber(10)).call();
                actual.toString(10).should.be.equal(expected.toString(10));
            }
        });

        it("should return the correct values on randomly selected block numbers", async function () {
            let expected;
            let actual;
            let rnd;
            for (let i = 0; i < 100; i++) {
                rnd = randomIntInc(0, 64000000);
                expected = curve.calculateBlockReward(rnd);
                actual = await rewardContract.methods.getBlockReward(rnd).call();
                actual.toString(10).should.be.equal(expected.toString(10));
            }
        });
    });
});

function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
