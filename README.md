# ewc-system-tests
Integration and system tests of EWC.

Based on web3.js, web3.py and Parity Ethereum.

## Maintainers
**Primary**: Pietro Danzi (@danzipie)

## Installation
```
npm install
npm run compile
```

Use the following templeate file to paste your private keys and place it at accounts/testaccounts.json.
This file must not be commited.

```
[
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


## Guidelines
 - **Scripts**: the folder "utils" contains useful Python scripts
 - **Sanity (integration) tests**: Mocha tests (inspired by the unit tests)

 ```
 npm test
 ```
- **System tests**