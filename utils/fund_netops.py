# funds the NetOps team with tokens
# can only be called from account that has tokens
# requires running Parity in the background

from web3.auto import w3
import os
import json
import time
import sys
import argparse

VALUE = 1000000000000000000 # amount

parser = argparse.ArgumentParser()
parser.add_argument('--keydir', help="Directory where you store the key file", required=True)
args = parser.parse_args()

beneficiaries = []
with open('./node_modules/ewf-genesis-generator/chainspec_skeletons/hardcoded_values_volta.json') as json_file:  
    hc = json.load(json_file)
    for address in hc['address_book']['NETOPS_MEMBERS']:
        beneficiaries.append(address)

PATH_KEYS = args.keydir
key_files = os.listdir(PATH_KEYS)
pkey = PATH_KEYS + key_files[0]
with open(pkey) as keyfile:
    encrypted_key = keyfile.read()
    encrypted_key_info = json.loads(encrypted_key)
    private_key = w3.eth.account.decrypt(encrypted_key, "1234")
    address = "0x" + encrypted_key_info['address']
    address = w3.toChecksumAddress(address)
    print('Sending from ' + address)

    nonce = w3.eth.getTransactionCount(address)
    print(beneficiaries)
    for beneficiary in beneficiaries:
        beneficiary = w3.toChecksumAddress(beneficiary)
        transaction = {
            'to': beneficiary,
            'value': VALUE,
            'gas': 46000,
            'gasPrice': 5,
            'nonce': nonce,
            'chainId': 0x12046
        }
        nonce = nonce + 1
        print('Sending ' + str(VALUE) + ' to ' + beneficiary)
        signed_tx = w3.eth.account.signTransaction(transaction, private_key)
        w3.eth.sendRawTransaction(signed_tx.rawTransaction)
