const path = require("path");
const fs = require("fs");

const vargs = require("yargs")
    .option('reset', {
        type: 'boolean',
        desc: "Resets payout address of validator.",
        demandOption: false,
        alias: "r",
        default: false
    })
    .option('checkonly', {
        type: 'boolean',
        desc: "Checks balances only",
        demandOption: false,
        alias: "c",
        default: false
    })
    .option('account', {
        type: 'string',
        desc: "Validator account.",
        demandOption: true,
        alias: ["v","validator"]
    })
    .option('accounts', {
        type: 'string',
        desc: "Path to the file containing the accounts.",
        demandOption: false,
        alias: "a",
        default: "../accounts/testaccounts_dev.json"
    })
    .option('payoutaddress', {
        type: 'string',
        desc: "Path to the file containing the accounts.",
        demandOption: false,
        alias: "p",
        default: "0x0000000000000000000000000000000000099999"
    })
    .option('ws', {
        type: 'string',
        desc: "Websocket RPC API endpoint.",
        demandOption: false,
        alias: "w",
        default: "ws://localhost:8546" 
    })
.help()
.argv;

async function validatorPayout(vargs) {
    console.log(vargs)
    const randomAddress = "0x0000000000000000000000000000000000099999";

    const {
        ChainspecValues,
        BlockRewardJSON
    } = require(__dirname + "/../test_sanity/utils.js");

    const Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.WebsocketProvider(vargs.ws));
    
    let testaccs = JSON.parse(fs.readFileSync(path.join(__dirname, vargs.accounts)));
    testaccs.map(acc => web3.eth.accounts.wallet.add(acc.privateKey));

    let accounts = [];
    for (let i = 0; i < web3.eth.accounts.wallet.length; i++) {
        accounts.push(web3.utils.toChecksumAddress(web3.eth.accounts.wallet[i].address));
    }

    let reward = new web3.eth.Contract(BlockRewardJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["REWARD"]));
    
    console.log(vargs.account, "->", await reward.methods.payoutAddresses(vargs.account).call());
    console.log(vargs.account, await web3.eth.getBalance(vargs.account));
    console.log(vargs.payoutaddress, await web3.eth.getBalance(vargs.payoutaddress));
    
    if (vargs.checkonly) {
        closeConn(web3);
        return;
    }

    if (vargs.reset) {
        await reward.methods.resetPayoutAddress().send({
            from: vargs.account,
            gas: 1000000
        })
        closeConn(web3);
        return;
    }

    await reward.methods.setPayoutAddress(vargs.payoutaddress).send({
        from: vargs.account,
        gas: 1000000
    })

    console.log(vargs.account, "->", await reward.methods.payoutAddresses(vargs.account).call());
    closeConn(web3);
}

function closeConn(web3) {
    web3.currentProvider.connection.close();
}

validatorPayout(vargs);