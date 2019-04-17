const fs = require("fs");

const REVERT_ERROR_MSG = "Transaction has been reverted by the EVM";
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
  return new Promise((resolve, reject) => web3.currentProvider.send({
    id: 0,
    jsonrpc: '2.0',
    method,
    params
  }, (e, data) => {
    if (e) {
      reject(e);
    } else {
      resolve(data);
    }
  }));
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const waitForSomething = async (waitFunctions, ms) => {

  let waiting = false;
  do {
    waiting = false;
    for (waitFunction of waitFunctions) {
      waiting = waiting ? true : (await waitFunction.execute()) !== waitFunction.waitUntil;
    }
    await sleep(5000);
  } while (waiting);
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
  accounts.push(
    {
      "privateKey": "0x989a1e104b66770d8258ba292f92c6cfea9afb348fca919a5f51033444502062",
      "address": "0x1e490821f6ca7c66aa0a8f880ad460dda90be6bf"
    })
  accounts.map(acc => web3.eth.accounts.wallet.add(acc.privateKey));
}

async function sendMultisigTransaction(web3, multisig, transaction, destination, submitterWalletPosition = 0) {
  multisig.transactionConfirmationBlocks = 1

  const submitter = web3.eth.accounts.wallet.accounts[submitterWalletPosition].address;
  const confirmer = submitterWalletPosition == 0 ? web3.eth.accounts.wallet.accounts['1'].address : web3.eth.accounts.wallet.accounts['0'].address;

  const submitGas = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).estimateGas({
    from: submitter
  });

  const logs = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).send({
    from: submitter,
    //gas: Math.floor(submitGas * 5)
    gas: 5000000

  });

  const transactionID = logs.events.Submission.returnValues.transactionId.toString(10);
  const confirmGas = await multisig.methods.confirmTransaction(transactionID).estimateGas({
    from: confirmer
  });
  return multisig.methods.confirmTransaction(transactionID).send({
    from: confirmer,
    //gas: Math.floor(confirmGas * 5)
    gas: 5000000
  });
}

const ChainspecValues = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json")
);

const MultiSigWalletJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/multisig-wallet-gnosis/build/contracts/MultiSigWallet.json")
);

const RelayedJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/genome-system-contracts/build/contracts/ValidatorSetRelayed.json")
);
const RelayJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/genome-system-contracts/build/contracts/ValidatorSetRelay.json")
);

const BlockRewardJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/genome-system-contracts/build/contracts/BlockReward.json")
);

const TestSCurveProvder = require("./blockreward_function");

const testValidators = [
  "0x185a57da13cd6c54b1158b1876a19a161dc7cb5e",
  "0xacb657870cd1186d8e821d27dfd611a8e8a049d0",
  "0xb56d4421edfe103874c244fd9e257effd56cb5b5",
  "0x995035660ac462805c8c3ac8a0b48184a20fef74",
  "0x9338b27a3836b79ef306db4a3ac3cc17c6b69a0b",
  "0xe3f0a5c3345f93b3a182a18fb523161ec27db3d1",
  "0xcd96492e1647ce2db5e87eaf7eb4b9f9ae108301",
  "0xf896d8b88928db52cb080bffa9908bd84b12606e",
  "0x12c7d165a7b38cbbf26f43d0025334293973425b",
  "0x958980de5bfccba9aa112a0c8103cc83d7777ca5",
  "0x951dc7541a6cd7b5fa7908d18ed5a9552c99b475",
  "0xbe548ce40179b360fab6ac188e1c2f42da588c7a",
  "0x27ce8bf591c15cb5276b95c5f333ebb8d0746372"
];
// validator 1-3 + community
const testPayoutAddresses = ["0x00371459b526eA286E3e898950cE8F713B540f0B", "0x00d99132c825Ecfd224832EDe811177ad1512610", "0x0019E00282A6C64d0B2a37df7B9c98B298cc605A", "0x000E9A1A767eA9B3A092ED49c45Eb7f8e318BD39"];

const initialValidators = ChainspecValues.address_book["INITAL_VALIDATORS"];

module.exports = {
  sleep,
  waitForSomething,
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
}
