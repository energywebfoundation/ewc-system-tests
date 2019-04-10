const fs = require("fs");

const REVERT_ERROR_MSG = "VM Exception while processing transaction: revert";
const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const SYSTEM_ADDRESS = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";
const EMPTY_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

const CHAINSPEC_VALUES = "./node_modules/ewf-genesis-generator/sample_chainspec/chainspec_skeletons/hardcoded_values_volta.json";

const ValidatorState = {
    NonValidator: "0",
    FinalizedValidator: "1",
    PendingToBeAdded: "2",
    PendingToBeRemoved: "3"
}

const send = (method, params = []) => {
    return new Promise((resolve, reject) => web3.currentProvider.send({id: 0, jsonrpc: '2.0', method, params }, (e, data) => {
        if (e) {
            reject(e);
        } else {
            resolve(data);
        }
    }));
}

async function assertThrowsAsync(fn, msg) {
    try {
        await fn();
    } catch (err) {
        assert(err.message.includes(msg), "Expected error to include: " + msg);
        return;
    }
    assert.fail("Expected fn to throw");
}

function addTestWallets(web3) {
    
    let accounts = JSON.parse(fs.readFileSync(__dirname + "/../accounts/testaccounts.json"));
    accounts.map(acc => web3.eth.accounts.wallet.add(acc.privateKey));
}

async function sendMultisigTransaction(web3, multisig, transaction, destination, submitterWalletPosition = 0) {
    multisig.transactionConfirmationBlocks = 1

    const submitter = web3.eth.accounts.wallet.accounts[submitterWalletPosition].address;
    const confirmer = submitterWalletPosition == 0 ? web3.eth.accounts.wallet.accounts['1'].address : web3.eth.accounts.wallet.accounts[submitterWalletPosition].address;
    
    const submitGas = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).estimateGas({from: submitter});
    const logs = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).send({
        from: submitter, 
        gas: Math.floor(submitGas * 1.1)

    });
    const transactionID = logs.events.Submission.returnValues.transactionId.toString(10);
    const confirmGas = await multisig.methods.confirmTransaction(transactionID).estimateGas({from: confirmer});
    return multisig.methods.confirmTransaction(transactionID).send({
        from: confirmer,
        gas: Math.floor(confirmGas * 1.1)

    });
}

ChainspecValues =
    JSON.parse(
        fs.readFileSync(__dirname + "/../node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json")
    );


module.exports = {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32,
    sendMultisigTransaction,
    addTestWallets,
    ValidatorState,
    ChainspecValues
}
