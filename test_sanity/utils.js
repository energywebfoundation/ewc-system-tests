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

function addTestWallets() {
    fs = require("fs");
    let accounts = JSON.parse(fs.readFileSync(__dirname + "/../accounts/testaccounts.json"));
    accounts.map(acc => web3.eth.accounts.wallet.add(acc));
}

const Web3 = require('web3');
const web3 = new Web3 (new Web3.providers.WebsocketProvider('ws://18.130.251.19:8546'));
addTestWallets();

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
    ValidatorState,
    web3,
    ChainspecValues
}
