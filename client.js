//Was
//const cry = require('thor-devkit/dist/cry')
//const Transaction = require('thor-devkit/dist/transaction').Transaction
//Changed to (below) due to nodejs not being able to find any of the /dist/... files. 
import { Transaction, secp256k1, address } from 'thor-devkit'

// Construct transaction body.
const txBody = {
    // Test-net: 0x27,  Main-net: 0x4a.
    chainTag: 0x27,
    // After which block this tx should happen?
    // 16 characters of block ID.
    blockRef: connex.thor.status.head.id.slice(0, 18),
    // Expires after 30 days.
    expiration: 30 * 8640,
    // Call the contract method "increaseAmount"
    clauses: [{
        to: '0x6d48628bb5bf20e5b4e591c948e0394e0d5bb078',
        value: 0,
        data: '0x74f667c4'
    }],
    gasPriceCoef: 0,
    gas: 50000,
    dependsOn: null,
    nonce: '0xa3b6232f', // Random number
    // Must include this field to activate VIP-191.
    reserved: { 
        features: 1
    }
}

// Construct a transaction.
const tx = new Transaction(txBody);

// User private key.
const originPriv = Buffer.from(
    '2a0cbfe49ea7c18e89b87be4237e1717823fc16b52dc02e91fb30af122fba9b3',
    'hex'
)

//Was 
//const originAddress = cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(originPriv))
//Changed to
// User public address: 0x881Ab2380017870C49a9A114806C05F3CFE406e2
const pubKey = secp256k1.derivePublicKey(originPriv);
const originAddress = address.fromPublicKey(pubKey);

// Construct the hash for signing.
const originHash = tx.signingHash();

//Was
//const originSignature = cry.secp256k1.sign(originHash, originPriv)
//Changed to
// Construct the user signature.
const originSignature = secp256k1.sign(originHash, originPriv);

// HTTP function definition
async function getSponosrSignature(sender, txBody) {
    const url = 'http://localhost:4000/'
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
            'sender': sender,
            'txBody': txBody
        })
    })

    const r = await response.json()
    return r['sponsor_signature']
}

// Fetch the sponsor signature.
//Was 
//const sponsorSignature = await getSponosrSignature(
//    '0x'+originAddress.toString('hex'),
//    txBody
//)

const sponsorSignature = getSponosrSignature(
    originAddress.toString('hex'),
    txBody
)
.then(res => {
    console.log("response = " + res);
    secondPart(res);
    return res
})
//Typescript did not accept async functions so had to quickly modify to promises.
function secondPart(ssig){
    const sig = Buffer.concat([
        originSignature,
        Buffer.from(ssig, 'hex')
    ])
    
    // Mount on the combined signature.
    tx.signature = sig
    
    // Convert the tx to raw format.
    const rawTx = '0x' + tx.encode().toString('hex');
    
    console.log("rawTx:   ", rawTx);
    
    // Submit the raw transaction by hand to the test-net.
    const url = 'https://sync-testnet.vechain.org/transactions'
    console.log(JSON.stringify({'raw': rawTx}));
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        mode: 'no-cors',
        body: JSON.stringify({'raw': rawTx})
    }).then(response => {
        response.text().then(r => {console.log(r)})
    }).catch(err => {
        console.log('err', err)
    })
}
