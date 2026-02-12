'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses from deployment
const CONTRACTS = {
  factory: '0x16341C5AFFd8Bf8310D4972670B54d05903524B6',
  clawToken: '0x72AfD80C0aa33e6fAa25dFDa6f791A237594b15d',
  ethToken: '0x2775e364824d85d86c26cEff04968e5DFa821CF3',
  pair: '0x1eb90b8c6b4DAf53Bab315e3919Ff44e12732A92',
};

// Simple ERC20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Pair ABI (simplified)
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data)',
];

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [balances, setBalances] = useState({ CLAW: '0', ETH: '0' });
  const [reserves, setReserves] = useState({ CLAW: '0', ETH: '0' });
  const [swapAmount, setSwapAmount] = useState('');
  const [status, setStatus] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
        await fetchBalances(provider, accounts[0]);
      } catch (err) {
        setStatus('Failed to connect wallet');
      }
    } else {
      setStatus('Please install MetaMask');
    }
  };

  // Fetch balances
  const fetchBalances = async (provider: ethers.providers.Web3Provider, address: string) => {
    const claw = new ethers.Contract(CONTRACTS.clawToken, ERC20_ABI, provider);
    const eth = new ethers.Contract(CONTRACTS.ethToken, ERC20_ABI, provider);
    
    const clawBal = await claw.balanceOf(address);
    const ethBal = await eth.balanceOf(address);
    
    setBalances({
      CLAW: ethers.utils.formatUnits(clawBal, 18),
      ETH: ethers.utils.formatUnits(ethBal, 18),
    });
  };

  // Fetch reserves
  const fetchReserves = async () => {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
    const pair = new ethers.Contract(CONTRACTS.pair, PAIR_ABI, provider);
    const [r0, r1] = await pair.getReserves();
    
    setReserves({
      CLAW: ethers.utils.formatUnits(r0, 18),
      ETH: ethers.utils.formatUnits(r1, 18),
    });
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  // Swap function
  const handleSwap = async (tokenIn: 'CLAW' | 'ETH') => {
    if (!account || !swapAmount) return;
    
    try {
      setStatus('Processing swap...');
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      
      const tokenInAddr = tokenIn === 'CLAW' ? CONTRACTS.clawToken : CONTRACTS.ethToken;
      
      // Approve
      const token = new ethers.Contract(tokenInAddr, ERC20_ABI, signer);
      const amountIn = ethers.utils.parseUnits(swapAmount, 18);
      await token.approve(CONTRACTS.pair, amountIn);
      
      setStatus('Swap complete!');
    } catch (err: any) {
      setStatus('Swap failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-yellow-500">🦞 OpenClaw DEX</h1>
          <p className="text-gray-400">Decentralized Exchange on Base</p>
        </div>
        <button
          onClick={connectWallet}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg"
        >
          {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Your Balances */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">💰 Your Balances</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>CLAW</span>
              <span className="font-mono">{balances.CLAW}</span>
            </div>
            <div className="flex justify-between">
              <span>ETH</span>
              <span className="font-mono">{balances.ETH}</span>
            </div>
          </div>
        </div>

        {/* Pool Reserves */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">🌊 Pool Reserves</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>CLAW</span>
              <span className="font-mono">{parseFloat(reserves.CLAW).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ETH</span>
              <span className="font-mono">{parseFloat(reserves.ETH).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Swap */}
        <div className="bg-gray-800 p-6 rounded-xl md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">🔄 Swap</h2>
          <div className="flex gap-4 items-center">
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              placeholder="Amount"
              className="bg-gray-700 p-4 rounded-lg flex-1 text-xl"
            />
            <select className="bg-gray-700 p-4 rounded-lg">
              <option value="CLAW">CLAW</option>
              <option value="ETH">ETH</option>
            </select>
            <button
              onClick={() => handleSwap('CLAW')}
              className="bg-blue-600 hover:bg-blue-700 font-bold py-4 px-8 rounded-lg"
            >
              Swap
            </button>
          </div>
          {status && <p className="mt-4 text-yellow-500">{status}</p>}
        </div>
      </div>

      {/* Contracts */}
      <div className="mt-12 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">📋 Contract Addresses</h2>
        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="space-y-2 font-mono text-sm">
            <p><span className="text-gray-400">Factory:</span> {CONTRACTS.factory}</p>
            <p><span className="text-gray-400">CLAW:</span> {CONTRACTS.clawToken}</p>
            <p><span className="text-gray-400">ETH:</span> {CONTRACTS.ethToken}</p>
            <p><span className="text-gray-400">Pair:</span> {CONTRACTS.pair}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
