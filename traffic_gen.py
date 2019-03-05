from web3.auto import w3
import os
import json
import time
import threading
from queue import Queue

print_lock = threading.Lock()

# link the keys that sign
PATH_KEYS = ""
key_files = os.listdir(PATH_KEYS)
target_gas = 1000000

# this thread is associated with a unique spamming address
class SpamThread(threading.Thread):
    def __init__(self, queue, args=(), kwargs=None):
        threading.Thread.__init__(self, args=(), kwargs=None)
        self.queue = queue
        self.daemon = True
        self.receive_messages = args[0]
        self.addr_rx = args[1]
        self.private_key = args[2]
        self.nonce = w3.eth.getTransactionCount(w3.eth.coinbase)

    def run(self):
        print(threading.currentThread().getName(), self.receive_messages)
        while True:
            val = self.queue.get()
            self.do_thing_with_message(val)

    # sign and send `n_tx` transactions
    def do_thing_with_message(self, message):
        if self.receive_messages:
            # with print_lock:
            #   print(threading.currentThread().getName(), "Received {}".format(message))

            for count in range(message):
                transaction = {
                    'to': self.addr_rx,
                    'value': 100,
                    'gas': 46000,
                    'gasPrice': 5,
                    'nonce': self.nonce,
                    'chainId': 0x62122
                }
                signed_tx = w3.eth.account.signTransaction(transaction, self.private_key)
                w3.eth.sendRawTransaction(signed_tx.rawTransaction)
                self.nonce = self.nonce + 1


def update_target(_target_gas, _average, _target):
    # decide increase/decrease of target
    if _average < 0.8 * _target_gas:
        _target += 5
    elif _average <= _target_gas:
        _target += 2
    elif _average > 1.2 * _target_gas:
        _target -= 5
    else:
        _target -= 2

    if _target < 0:
        _target = 1

    return _target


if __name__ == '__main__':

    # some local variables
    blockno_p = 0
    average = 0
    counter = 0

    # parameters
    FACTOR = 3  # filter. I am using this: https://stackoverflow.com/questions/12636613/
    target = 1  # number of transactions to be sent in a block

    threads = []
    for t in range(1):  # 1 to be changed to len(key_files)

        # get the necessary info for this account
        pkey = PATH_KEYS + key_files[t]
        with open(pkey) as keyfile:
            encrypted_key = keyfile.read()
            encrypted_key_info = json.loads(encrypted_key)
            private_key = w3.eth.account.decrypt(encrypted_key, "1234")
            addr_rx = "0x" + encrypted_key_info['address']
            addr_rx = w3.toChecksumAddress(addr_rx)

        q = Queue()
        threads.append(SpamThread(q, args=(t % 2 == 0, addr_rx, private_key, target_gas)))
        threads[t].start()
        time.sleep(0.1)

    while True:  # keep looping
        time.sleep(0.1)
        blockno = w3.eth.getBlock('latest').number  # get block
        if blockno > blockno_p:
            # ask for block info
            cur_block = w3.eth.getBlock(blockno)
            blockno_p = blockno

            # update filter
            counter += 1
            average = average + (cur_block.gasUsed - average) / min(counter, FACTOR)
            # update target number of txs per block per account
            target = update_target(target_gas, average, target)

            for t in threads:
                t.queue.put(target)

    for t in threads:
        t.join()
