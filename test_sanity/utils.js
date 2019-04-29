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

  const logs = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).send({
    from: submitter,
    gas: 5000000
  });

  const transactionID = logs.events.Submission.returnValues.transactionId.toString(10);
  return multisig.methods.confirmTransaction(transactionID).send({
    from: confirmer,
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
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/ValidatorSetRelayed.json")
);
const RelayJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/ValidatorSetRelay.json")
);

const BlockRewardJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/BlockReward.json")
);

const HoldingJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/Holding.json")
);

const NodeControlSimpleJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/NodeControlSimple.json")
);

const NodeControlLookUpJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/NodeControlLookUp.json")
);

const NodeControlDbJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/NodeControlDb.json")
);

const RegistryJSON = JSON.parse(
  fs.readFileSync(__dirname + "/../node_modules/ewc-system-contracts/build/contracts/SimpleRegistry.json")
);

const TestSCurveProvder = require("./blockreward_function");

const testValidators = [
  "0xbcd364b631aeff093c42ebf08bceb5241e624008",
  "0xecd5f219953003deacfac738d34e843a1bdf7f17",
  "0x1e4a5b32eef4938a8b46fc4a7824f44b3e5de3ec"
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
  HoldingJSON,
  NodeControlSimpleJSON,
  NodeControlLookUpJSON,
  NodeControlDbJSON,
  RegistryJSON,
  initialValidators,
  testValidators,
  testPayoutAddresses,
  TestSCurveProvder
}
