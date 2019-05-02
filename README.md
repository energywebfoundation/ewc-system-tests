# EWC and Volta system level tests
Based on web3.js, web3.py and Parity Ethereum.

## Maintainers
**Primary**: Pietro Danzi (@danzipie)

Adam Nagy (@ngyam), Heiko Burkhardt (@hai-ko), Jonas Bentke (@jbentke)

## Pre-requisites
- node 8
- npm

## Installation
### 1. NPM Scripts
```
npm install
```
This pulls some dependency repos, such as the [contracts repo](https://github.com/energywebfoundation/ewc-system-contracts) and the [chainspec generator](https://github.com/energywebfoundation/ewf-genesis-generator).
```
npm run compile
```
This compiles the contracts with a local truffle in order to obtain their ABI.

### 2. Test Accounts

Since these tests run on a live chain, some unlocked accounts with ethers are needed for testing.

The tests expect the test accounts to be in the `accounts/testaccounts.json` file. Use the template snippet below to paste your private keys and place it there.
**Important:**
 - This file must not be commited.
 - You need to add at least 3 addresses.
 - The first two addresses must be `VALIDATOR_NETOPS` and `COMMUNITY_FUND` multisig contract owners. These accounts also need to be funded before the tests can be executed.
 - This means that the `VALIDATOR_NETOPS` and `COMMUNITY_FUND` multisig must to have a confirmation threshold of 2 to run the tests successfully.
 - The third address can be an address of your choosing.

`accounts/testaccounts.json` template:
```
[
    {
        "privateKey": "0xaddhere",
        "address": "0xaddhere"
    },
    {
        "privateKey": "0xaddhere",
        "address": "0xaddhere"
    },
    {
        "privateKey": "0xaddhere",
        "address": "0xaddhere"
    }
]
```

### 3. Run Local Client 
Download an EWF chain spec file, e.g. for [Volta](https://github.com/energywebfoundation/ewf-chainspec/blob/master/Volta.json) and run:
```
parity --chain ./Volta.json --jsonrpc-apis=all --jsonrpc-cors=all --ipc-apis=all --ws-apis=all --ws-origins=all --no-persistent-txqueue --no-warp --pruning=archive
```
**Important**: leave the rpc and ws interfaces at their default setting: `local`. The default ports 8545 for rpc and 8546 for ws are used by the tests.

## Test Execution
To run the tests, execute:
```
npm test
```

**Important**: Do not stop the tests before they are completed. Stopping the tests may lead to an unclean state which needs to be cleand manually.

## Guidelines
 - **Scripts**: the folder [utils](./utils) contains useful Python scripts
 - **Sanity (integration) tests**: Mocha tests (inspired by the unit tests)
 - **Security tests**: Mocha tests

## Contributing

Please read our [CONTRIBUTING guide](./CONTRIBUTING.md) for our code of conduct and for the process of submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. 

## License

This project is licensed under the GPLv3 License - see the [LICENSE](./LICENSE) file for details.

## FAQ
