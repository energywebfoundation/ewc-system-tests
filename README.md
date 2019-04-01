# core-test-automation
The swiss army knife to test functionality of Ethereum-based blockchains.

Based on web3.js, web3.py and Parity Ethereum.

## Maintainers
**Primary**: Pietro Danzi (@danzipie)

## Installation
```
npm install
cd ..
git clone git@github.com:energywebfoundation/ewf-genesis-generator.git
cd core-test-automation
# if you want to use python scripts
virtualenv -p python3 venv
source venv/bin/activate
pip install -r requirements.txt
```

## Guidelines
 - **Traffic generator**: the folder "utils" contains Python scripts useful for testing
 - **Sanity test**: Mocha tests (inspired by the unit tests)
 ```
 npm test
 ```
 