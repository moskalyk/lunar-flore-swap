import React from 'react';
import './App.css';
import logo from './plants.png'
import { 
  Box,
  TextInput as Input,
  Button,
  MoonIcon,
  Spinner,
  RadioGroup,
  useTheme } from '@0xsequence/design-system'
import { sequence } from '0xsequence'
import { ethers } from 'ethers'
import { SequenceIndexerClient } from '@0xsequence/indexer'

import {abi} from './abi'

function App() {
  const [usdcBalance, setUsdcBalance] = React.useState(1000)
  const [message, setMessage] = React.useState('you will be swapping _ FLORE for 0 USDC')
  const [usdcAmount, setUsdcAmount] = React.useState<any>(null)
  const [allowanceAmount, setAllowanceAmount] = React.useState<any>(null)
  const [floreAmount, setFloreAmount] = React.useState<any>(null)
  const [defaultSwap, setDefaultSwap] = React.useState<any>(0)
  const [address, setAddress] = React.useState<any>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState<any>(false);

  sequence.initWallet('polygon')

  const connect = async () => {
    const wallet = sequence.getWallet()
    const details = await wallet.connect({
      app: 'FloreSwap',
      networkId: 137,
      authorize: true
    })
    if(details.connected){
      setAddress(details.session?.accountAddress!)
      setIsLoggedIn(true)
      console.log(details)
    }
  }

  const performSwap = async () => {
    const floreSwapContract = '0x3B685C2c3F35Bd5275a6340700E769b6b82a3A20'
    const flore20ContractAddress = '0x6efa2ea57b5ea64d088796af72eddc7f5393dd2b'

    const wallet = await sequence.getWallet()

    // Craft your transaction
    const erc20Interface = new ethers.utils.Interface([
      'function approve(address spender, uint256 amount) public returns (bool)'
    ])
    

    // Craft your transaction
    const erc721Interface = new ethers.utils.Interface([
      'function swapTokens(uint256 amount, uint blockNumber, uint price, bytes memory xProof) external'
    ])
    
    // TODO: do a price request
    // const res = await fetch('http://localhost:8000/price')

    const res = await fetch("http://137.220.52.246:5000/signer/address", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ 
      address: address
    })
  })

    const json = await res.json()
    console.log(json)

    console.log([floreSwapContract, floreAmount*  10**18])

    // TODO: do an allowance ., check
    const data20 = erc20Interface.encodeFunctionData(
      'approve', [floreSwapContract, Math.floor(floreAmount)]
    )

    // json.price = 0
    // json.sig ="0x"

    // function swapTokens(uint256 amount, uint blockNumber, uint price, bytes memory xProof) external
    console.log([floreAmount, json.block,  json.price*10**18, json.sig])
    console.log(floreAmount / json.price)
    console.log(floreAmount)
    console.log(json.price)
    console.log(floreAmount / json.price * 10**6)

    const data = erc721Interface.encodeFunctionData(
      'swapTokens', [Math.floor(floreAmount), json.block,  Math.floor(json.price), json.sig]
    )

    const txn1 = {
      to: flore20ContractAddress,
      data: data20
    }

    const txn2 = {
      to: floreSwapContract,
      data: data
    }

    const signer = wallet.getSigner()
    
    console.log(txn1)
    console.log(txn2)
    const txRes = await signer.sendTransactionBatch([txn1, txn2])
    console.log(txRes)
  }

  const getDefaultPrice = async () => {
    const res = await fetch('http://137.220.52.246:5000/signer/default')
    const json = await res.json()
    console.log(json)
    setDefaultSwap(json.price)
  }

  const getBankBalanc = async () => {
    const indexer = new SequenceIndexerClient('https://polygon-indexer.sequence.app')

    // try any contract and account address you'd like :)
    const accountAddress = '0x3B685C2c3F35Bd5275a6340700E769b6b82a3A20'

    // query Sequence Indexer for all nft balances of the account on Polygon
    const balances = await indexer.getTokenBalances({
        accountAddress: accountAddress,
    })
    // console.log('collection of items:', nftBalances)
    balances.balances.map((token: any)=> {
      if(token.contractAddress == "0x2791bca1f2de4661ed88a30c99a7a9449aa84174") {
        setUsdcBalance(Number(token.balance) / 10**6)
      }
    })

    // Connect to the Ethereum network using ethers with a read-only provider
  const provider = new ethers.providers.JsonRpcProvider('https://nodes.sequence.app/polygon');

  // Create a contract instance using the ABI and contract address
  const contract = new ethers.Contract('0x3B685C2c3F35Bd5275a6340700E769b6b82a3A20', abi, provider);

  try {
    // Call the 'calculateAllowedSwapAmount' function on the contract
    console.log(address)
    const result = await contract.getRemainingSwapAmount(address);
    console.log('Result:', result.toString());
    setAllowanceAmount(Number(result.toString())/10**6)
  } catch (error) {
    console.error('Error calling function:', error);
  }
  }

  React.useEffect(() => {
    getDefaultPrice()
    getBankBalanc()
    setInterval(() => {
      getDefaultPrice()
      getBankBalanc()
    }, 7000)
  }, [address])

  return (
    <div className="App">
      {
      !isLoggedIn 
      ? 
        <>
          <br/>
          <br/>
          <br/>
          <br/>
          <br/>
          <h1>FloreSwap</h1>
          <img width={'10%'} style={{bottom: '20%', left: '45%', position: 'fixed'}}src={logo} />
          <br/>
          <br/>
          <br/>
          <Button onClick={() => connect()} style={{border: '1px solid black', background: '#4e47f5'}} label="Login" />
        </>
      : 

      <>
      <br/>
      <br/>
      <h1>1 USDC for {defaultSwap.toFixed(5)} _ </h1>
      <br/>
      <p>USDC : 🌝 : _</p>
      <br/>
        <img width={'10%'} src='https://www.circle.com/hubfs/Sundaes/810/USDC-810x810.png'/>
      <p style={{verticalAlign: 'middle', position: 'absolute', left: '48.5%', top: '28%', fontSize: '50px', padding: '10px'}} >{'↭'}</p>
      <img width={'12%'} style={{paddingLeft: '40px'}}src={logo} />
      <Box>
        <Box justifyContent={'center'}>
          <p style={{paddingLeft: '60px'}}>USDC in 🐖 bank</p>
          <p style={{paddingLeft: '100px'}}>max allowance / 1 day</p>
        </Box>
        <Box justifyContent={'center'}>
          <p style={{fontSize: '22px', paddingRight: '0px'}}>{usdcBalance}</p>

          <p style={{fontSize: '22px', paddingLeft: '200px'}}>{allowanceAmount}</p>
        </Box>
      </Box>
      <br/>
      <Box justifyContent={'center'}>
        <Input value={usdcAmount} onChange={(e: any) => {
          console.log(e)
          setUsdcAmount(e.target.value)
          setFloreAmount(e.target.value!*defaultSwap)
          setMessage(`you will be swapping ${(e.target.value*defaultSwap).toFixed(2)} FLORE for ${e.target.value} USDC`)
        }} style={{textAlign: 'center', fontFamily: 'Orbitron'}} placeholder="usdc amount"/>
        <Input value={floreAmount}  onChange={(e: any) => {
          console.log(e)
          setFloreAmount(e.target.value)
          setUsdcAmount(e.target.value / defaultSwap)
          setMessage(`you will be swapping ${e.target.value} FLORE for ${(e.target.value / defaultSwap).toFixed(2)} USDC`)
        }} 
        style={{textAlign: 'center', fontFamily: 'Orbitron'}} placeholder="flore amount"/>
      </Box>
      <br/>
      <p>{message}</p>
      <br/>
      <Button onClick={() => performSwap()} disabled={usdcAmount != null && usdcBalance < usdcAmount ? true : usdcAmount != null && allowanceAmount < usdcAmount ? true : usdcAmount == null || usdcAmount == 0 ? true : false} style={{border: '1px solid black'}}label="swap"/>
      <br/>
      <br/>
      {usdcBalance < usdcAmount ? <p style={{color: 'red'}}>swap exceeds 🐖 balance</p> : allowanceAmount < usdcAmount ? <p style={{color: 'red'}}>swap exceeds daily allowance</p> : null}
      </>
    }
    </div>
  );
}



export default App;
