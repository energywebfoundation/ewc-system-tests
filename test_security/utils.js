
async function sendMultisigTransactionGeneral(web3, multisig, transaction, destination, accounts, submitter) {
    multisig.transactionConfirmationBlocks = 1;

   const required = (await multisig.methods.required().call()).toNumber();

    let logs = await multisig.methods.submitTransaction(destination, web3.utils.toHex(transaction.value), transaction.data).send({
        from: submitter,
        gas: 3900000
    });

    const transactionID = logs.events.Submission.returnValues.transactionId.toString(10);

    if (accounts.length == 1 || required == 1) {
        return logs;
    }

    let confirmed = 0;
    for (let i = 0; i < accounts.length - 1; i++) {
        if (accounts[i] !== submitter) {
            logs = await multisig.methods.confirmTransaction(transactionID).send({
                from: accounts[i],
                gas: 3900000
            });
            confirmed += 1;
            if (confirmed == required - 1) {
                return logs;
            }
        }
    }
}

module.exports = {
    sendMultisigTransactionGeneral
}