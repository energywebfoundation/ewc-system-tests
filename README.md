# ewc-system-tests
Integration and system tests of EWC.

Based on web3.js, web3.py and Parity Ethereum.

## Maintainers
**Primary**: Pietro Danzi (@danzipie)

Adam Nagy (@ngyam), Heiko Burkhardt (@hai-ko), Jonas Bentke (@jbentke)

## Pre-requisites
- node 8
- npm
- Optional: python 3.6 environment for Slither

## Installation
### 1. NPM Scripts
```
npm install
npm run compile
```
### 2. Test Accounts

Use the following templeate file to paste your private keys and place it at `accounts/testaccounts.json`.
This file must not be commited. The first two addresses need to be added to the VALIDATOR_NETOPS and COMMUNITY_FUND multisig contract. These accounts also need to be funded before the tests can be executed.

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
Download the [chain spec file](https://github.com/energywebfoundation/ewf-chainspec/blob/master/Volta.json) and run:
```
parity --chain ./volta.json --jsonrpc-apis all --unsafe-expose --pruning=archive
```

## Test Execution
To run the tests execute:
```
npm test
```
**Important**: Do not stop the tests before they are completed. Stopping the tests may lead to an unclean state which needs to be cleand manually.

## Guidelines
 - **Scripts**: the folder "utils" contains useful Python scripts
 - **Sanity (integration) tests**: Mocha tests (inspired by the unit tests)
 - **Security tests**

## Contributing

Please read our [CONTRIBUTING guide](./CONTRIBUTING.md) for our code of conduct and for the process of submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. 

## License

This project is licensed under the GPLv3 License - see the [LICENSE](./LICENSE) file for details.