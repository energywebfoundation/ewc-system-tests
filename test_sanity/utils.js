const REVERT_ERROR_MSG = "VM Exception while processing transaction: revert";
const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const SYSTEM_ADDRESS = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";
const EMPTY_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

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

module.exports = {
    assertThrowsAsync,
    REVERT_ERROR_MSG,
    DEFAULT_ADDRESS,
    SYSTEM_ADDRESS,
    EMPTY_BYTES32,
    ValidatorState
}
