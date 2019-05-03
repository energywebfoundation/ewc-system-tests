const path = require("path");
const fs = require("fs");

const vargs = require("yargs")
    .option('reset', {
        type: 'boolean',
        desc: "Removes validator account.",
        demandOption: false,
        alias: ["r","remove"],
        default: false
    })
    .option('accounts', {
        type: 'string',
        desc: "Path to the file containing the accounts.",
        demandOption: false,
        alias: "a",
        default: "../accounts/testaccounts_dev.json"
    })
    .option('account', {
        type: 'string',
        desc: "Validator account.",
        demandOption: false,
        alias: ["v","validator"],
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

async function setRelayed(vargs) {
    console.log(vargs)

    const {
        ChainspecValues,
        MultiSigWalletJSON,
        RelayJSON,
        RelayedJSON,
    } = require(__dirname + "/../test_sanity/utils.js");

    const {
        sendMultisigTransactionGeneral,
    } = require(__dirname + "/utils.js");

    const Web3 = require('web3');
    let web3 = new Web3(new Web3.providers.WebsocketProvider(vargs.ws));
    
    let testaccs = JSON.parse(fs.readFileSync(path.join(__dirname, vargs.accounts)));
    testaccs.map(acc => web3.eth.accounts.wallet.add(acc.privateKey));

    let accounts = [];
    for (let i = 0; i < web3.eth.accounts.wallet.length; i++) {
        accounts.push(web3.utils.toChecksumAddress(web3.eth.accounts.wallet[i].address));
    }

    let relayed = new web3.eth.Contract(RelayedJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAYED"]));
    let relay = new web3.eth.Contract(RelayJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_RELAY"]));
    
    let netOpsMultiSig = new web3.eth.Contract(MultiSigWalletJSON.abi, web3.utils.toChecksumAddress(ChainspecValues.address_book["VALIDATOR_NETOPS"]));

    for (let i = 0; i < accounts.length; i++) {
        console.log(accounts[i], await web3.eth.getBalance(accounts[i]));
    }

    let logs;
    if (vargs.reset) {
        logs = await sendMultisigTransactionGeneral(
            web3,
            netOpsMultiSig,
            {
                value: 0,
                data: relayed.methods.removeValidator(vargs.account).encodeABI()
            },
            relayed.address,
            accounts.slice(0,4),
            accounts[0]
        );
        console.log(logs);
        web3.currentProvider.connection.close();
        return;
    }

    logs = await sendMultisigTransactionGeneral(
        web3,
        netOpsMultiSig,
        {
            value: 0,
            data: relayed.methods.addValidator(vargs.account).encodeABI()
        },
        relayed.address,
        accounts.slice(0,4),
        accounts[0]
    );
    
    console.log(logs);
    console.log("end");
    web3.currentProvider.connection.close();
}

setRelayed(vargs);
