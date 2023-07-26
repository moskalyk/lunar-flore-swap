require('dotenv').config()
import { ethers, utils } from "ethers";
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fetch from 'cross-fetch'

const _addresses = [process.env.account_0, process.env.account_1]
const _state = [1,2,3,4]

const pkey = process.env.pkey!
var wallet = new ethers.Wallet(pkey);

const PORT = process.env.PORT || 5000
const app = express();

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:8084', "*"],
};
  
app.use(cors(corsOptions));
app.use(bodyParser.json())

const providers: any = {
    SEQUENCE_RPC: process.env.SEQUENCE_RPC,
    ALCHEMY_RPC: process.env.ALCHEMY_RPC,
    QUICKNODE_RPC: process.env.QUICKNODE_RPC,
    POLYGON_RPC: process.env.POLYGON_RPC,
    ANKR_RPC: process.env.ANKR_RPC
}

function getPriceWithDeviation(price, genesisTimestamp) {
    const millisecondsInCycle = 2555200 * 1000; // 2555200 seconds to milliseconds
    const currentTime = Date.now();
    const timeDifference = currentTime - genesisTimestamp;

    // Calculate the phase of the sine wave (ranging from 0 to 2 * Math.PI)
    const phase = (Math.PI * timeDifference) / millisecondsInCycle;

    // Calculate the deviation factor using the sine function (oscillating between -1 and 1)
    const deviationFactor = Math.sin(phase);

    // Calculate the deviation amount (5% of the price) and apply it to the original price
    const deviationAmount = 0.05 * deviationFactor;

    // Calculate the final price after deviation
    const finalPrice = price * (1 + deviationAmount);

    return finalPrice;
}

app.get('/signer/default', async (req: any, res: any) => {
    try{
        const price = 100
        const genesisTimestamp = 1689618660000; // Replace with the actual genesis timestamp
        const finalPrice = getPriceWithDeviation(price, genesisTimestamp);
        const bigNumberValue = ethers.BigNumber.from((finalPrice*10**18).toString());
        const provider = new ethers.providers.JsonRpcProvider(providers['SEQUENCE_RPC'])
        const blockNumber = await provider.getBlockNumber()
        const baseAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
        const hash = utils.solidityKeccak256(['uint', 'uint', 'address', 'address'], [bigNumberValue, blockNumber, req.body.address ? req.body.address : '0xbCDCC8D0DF0f459f034A7fbD0A6ce672AF0f0953', baseAddress])
        var signature = await wallet.signMessage(ethers.utils.arrayify(hash))
        res.send({sig: signature, price: finalPrice, status: 200})
    }catch(e){
        console.log(e)
        res.send({msg: JSON.stringify(e), status: 500})
    }
})

app.post('/signer/address', async (req: any, res: any) => {
    try{
        const price = 100
        const genesisTimestamp = 1689618660000; // Replace with the actual genesis timestamp
        const finalPrice = getPriceWithDeviation(price, genesisTimestamp);
        const bigNumberValue = ethers.BigNumber.from((finalPrice*10**18).toString());
        const provider = new ethers.providers.JsonRpcProvider(providers['SEQUENCE_RPC'])
        const blockNumber = await provider.getBlockNumber()
        const baseAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
        const hash = utils.solidityKeccak256(['uint', 'uint', 'address', 'address'], [Math.floor(finalPrice), blockNumber, req.body.address ? req.body.address : '0xbCDCC8D0DF0f459f034A7fbD0A6ce672AF0f0953', baseAddress])
        var signature = await wallet.signMessage(ethers.utils.arrayify(hash))
        res.send({sig: signature, price: finalPrice, block: blockNumber, status: 200})
    }catch(e){
        console.log(e)
        res.send({msg: JSON.stringify(e), status: 500})
    }
})

app.listen(PORT, async () => {
    console.log(`listening on port: ${PORT}`)
})