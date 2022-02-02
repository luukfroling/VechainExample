import express from "express"
import { Transaction, secp256k1 } from 'thor-devkit'
import cors from "cors"

const app = express();
app.use(express.json());
app.use(cors());
const port = 4000;

app.post('/', function(req, res) {

    // Re-construct the transaction from the request.
    const tx = new Transaction(req.body['txBody'])
    // Extract 'sender' address from request.
    const sender = req.body['sender']

    // Compute the sponsor hash.
    const sponsorHash = tx.signingHash(sender)

    // Sponsor account (with money): 
    // 0x126cdb344f476f25b9fb2050513f425a82f71046
    const sponsorPriv = Buffer.from(
        '5df5e7f22a71dfd3d032ff5eb9dfc7dbe9c950e0671745826639a0423cd45d7f',
        'hex'
    )

    // Compute the sponsor signature with hash+private key.
    const signature = secp256k1.sign(sponsorHash, sponsorPriv)
    console.log("signature", signature);
    console.log("signature with hex", signature.toString('hex'));

    // Send back the signature.
    res.send({
        'sponsor_signature': signature.toString('hex')
    })

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
