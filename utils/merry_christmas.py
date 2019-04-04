from web3.auto import w3
import os
import json
import time
import sys
import argparse

VALUE = 1000000000000000000

parser = argparse.ArgumentParser()
parser.add_argument('--keydir', help="Directory where you store the key file", required=True)
args = parser.parse_args()

beneficiaries = []
with open('../../ewf-genesis-generator/sample_chainspc/hardcoded_values.json') as json_file:  
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
    for beneficiary in beneficiaries:
        beneficiary = w3.toChecksumAddress(beneficiary)
        if not beneficiary == address: 
            transaction = {
                'to': beneficiary,
                'value': VALUE,
                'gas': 46000,
                'gasPrice': 5,
                'nonce': nonce,
                'chainId': 0x12046
            }
            print('Sending ' + VALUE + ' to ' + beneficiary)
            signed_tx = w3.eth.account.signTransaction(transaction, private_key)
            w3.eth.sendRawTransaction(signed_tx.rawTransaction)
