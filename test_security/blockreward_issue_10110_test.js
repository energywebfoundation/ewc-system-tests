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
    addTestWallets,
    DEFAULT_ADDRESS,
    TestSCurveProvder
} = require(__dirname + "/../test_sanity/utils.js");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));

addTestWallets(web3);


describe("Reward contract", function () {

    this.timeout(600000);

    let owner;
    let rewardContract;
    let relayed;
    let netOpsMultiSig;
    let comFundMultiSig;
    let accounts;
    let curve;
    let testContract;
    let communityReward;

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
        communityReward = new BN(ChainspecValues["balances"]["COMMUNITY_REWARD"]);

        testContract = new web3.eth.Contract([{"constant":true,"inputs":[],"name":"x","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_x","type":"uint256"}],"name":"setX","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_x","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"newX","type":"uint256"}],"name":"NewX","type":"event"}]);
        testContract = await testContract.deploy(
                {
                    data: "0x608060405234801561001057600080fd5b506040516020806101bf8339810180604052602081101561003057600080fd5b810190808051906020019092919050505080600081905550807f5ee7539fbb38ebe5783b7feb7c93f87d90b53ad26880d40d285840762f3d8a6860405160405180910390a25061013a806100856000396000f3fe608060405260043610610046576000357c0100000000000000000000000000000000000000000000000000000000900480630c55699c1461004b5780634018d9aa14610076575b600080fd5b34801561005757600080fd5b506100606100c9565b6040518082815260200191505060405180910390f35b34801561008257600080fd5b506100af6004803603602081101561009957600080fd5b81019080803590602001909291905050506100cf565b604051808215151515815260200191505060405180910390f35b60005481565b600081600081905550817f5ee7539fbb38ebe5783b7feb7c93f87d90b53ad26880d40d285840762f3d8a6860405160405180910390a26001905091905056fea165627a7a72305820fb65c17b4b54afecd4b01837ac25f6fa87e2d0286e715caf56ee58383b633e2e0029",
                    arguments: [89]
                }
            ).send(
                {
                    from: accounts[0], 
                    gas: '4700000'
                }
        );
    });

    // https://github.com/paritytech/parity-ethereum/issues/10110
    it("should not reprouce Parity issue 10110", async function () {
        let num;
        let logs;
        let bnum;
        let mintedInBlock;
        let block;
        let receiver;
        for (let i = 0; i < 20; i++) {
            num = randomIntInc(1, 10000);
            
            logs = await testContract.methods.setX(num).send(
                {
                    from: accounts[randomIntInc(0, 1)],
                    gas: 500000,
                    gasPrice: 0
                }
            );
            (await testContract.methods.x().call()).toString(10).should.be.equal(num.toString(10));
            bnum = logs.blockNumber;
            console.log("blocknumber:", bnum);
            mintedInBlock = new BN((await rewardContract.methods.mintedInBlock(bnum).call()).toString(10));
            console.log("minted:",mintedInBlock.toString(10));
            calculatedReward = curve.calculateBlockReward(bnum);
            mintedInBlock.toString(10).should.be.equal(calculatedReward.add(communityReward).toString(10));
            block = await web3.eth.getBlock(bnum);
            receiver = await rewardContract.methods.payoutAddresses(block.miner).call();
            receiver = receiver === DEFAULT_ADDRESS ? block.miner : receiver;
            (await web3.eth.getBalance(receiver)).toString(10)
                .should.be.equal(calculatedReward.add(new BN((await web3.eth.getBalance(receiver, bnum-1)).toString(10))).toString(10));
        }
    });

});

function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
