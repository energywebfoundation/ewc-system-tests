// checks that system contracts are configured as expected
const Web3 = require('web3');
const fs = require('fs');
var assert = require('assert');
var http = require('http');
var async = require('async');

// parity --chain "Volta.json" --jsonrpc-port 8540 --ws-port 8450 --jsonrpc-apis "all"
var web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8450'));
const VALUES = "../ewf-genesis-generator/sample_chainspc/hardcoded_values.json"
const CONTRACT = "ValidatorSetRelayed"
var values = {};


describe("NetOps", () => {

  describe("Validator tests", () => {

    it("can add one validator", () => {
      // Put test here
    });

    it("can remove one validator", () => {
      // Put test here
    });

    it("can add 25 validators", () => {
      // Put test here
    });

    it("can remove 25 validators", () => {
      // Put test here
    });

  });
});