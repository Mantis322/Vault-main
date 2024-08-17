"use client";
import { useState, useEffect } from 'react';
import Image from "next/image";
import { useWallet } from '../../hooks/WalletContext';

export default function EmployeeSelection() {
  const [selectedVault, setSelectedVault] = useState('');
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

  const vaults = [
    { id: 'VA001', name: 'Employee Vault Alpha', claimableBalance: '500 ETH' },
    { id: 'VB002', name: 'Employee Vault Beta', claimableBalance: '250 ETH' },
    { id: 'VG003', name: 'Employee Vault Gamma', claimableBalance: '375 ETH' },
  ];


  return (
    <main className="min-h-screen flex flex-col text-white bg-black">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

        .galaxy-bg {
          background-image: 
            radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
            radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
            radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px),
            radial-gradient(rgba(255,255,255,.4), rgba(255,255,255,.1) 2px, transparent 30px);
          background-size: 550px 550px, 350px 350px, 250px 250px, 150px 150px;
          background-position: 0 0, 40px 60px, 130px 270px, 70px 100px;
          animation: galaxyAnimation 120s linear infinite;
        }

        @keyframes galaxyAnimation {
          0% { background-position: 0 0, 40px 60px, 130px 270px, 70px 100px; }
          100% { background-position: 550px 550px, 390px 410px, 380px 820px, 220px 650px; }
        }
      `}</style>
      
      <header className="flex justify-between items-center p-6 bg-black bg-opacity-60 backdrop-blur-sm">
        <h1 className="text-4xl font-bold tracking-wider text-purple-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          VAULT
          </h1>
        {walletAddress ? (
          <div className="flex items-center">
            <span className="mr-4 text-purple-300">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
      </header>

      <div className="flex-1 galaxy-bg p-12">
        <h2 className="text-3xl font-semibold mb-8 text-center">Select Employee Vault to Claim</h2>
        <div className="max-w-2xl mx-auto bg-black bg-opacity-70 p-6 rounded-lg">
          {vaults.map((vault) => (
            <div 
              key={vault.id}
              className={`p-4 mb-4 rounded-lg cursor-pointer transition-all ${
                selectedVault === vault.id 
                  ? 'bg-purple-700' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedVault(vault.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{vault.name}</h3>
                <span className="text-sm text-purple-400">ID: {vault.id}</span>
              </div>
              <p className="text-gray-300">Claimable Balance: {vault.claimableBalance}</p>
            </div>
          ))}
          <button 
            className={`w-full mt-6 py-2 rounded-lg transition-colors ${
              selectedVault 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-gray-600 cursor-not-allowed'
            }`}
            disabled={!selectedVault}
          >
            Claim
          </button>
        </div>
      </div>

      <footer className="bg-black bg-opacity-60 text-purple-200 py-4 text-center">
        <p>&copy; 2024 Vault. All rights reserved.</p>
      </footer>
    </main>
  );
}