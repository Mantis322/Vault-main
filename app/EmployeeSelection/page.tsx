"use client";
import { useState, useEffect } from 'react';
import Image from "next/image";
import { useWallet } from '../../hooks/WalletContext';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../hooks/WalletABI';
import { CONTRACT_ADDRESS } from '../../hooks/ContractAdress';

export default function EmployeeSelection() {
  const [selectedVault, setSelectedVault] = useState('');
  const [vaults, setVaults] = useState<Array<{ id: string, name: string, claimableBalance: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { walletAddress, provider, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    if (walletAddress && provider) {
      fetchVaults();
    }
  }, [walletAddress, provider]);

  const fetchVaults = async () => {
    if (!provider || !walletAddress) {
      console.log("Provider or wallet address is missing");
      return;
    }
  
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Calling getEmployeeVaultNumbers for address:", walletAddress);
      const vaultNumbers = await contract.getEmployeeVaultNumbers();
      console.log("Received vault numbers:", vaultNumbers);
  
      if (vaultNumbers.length === 0) {
        console.log("No vaults found for this employee");
        setVaults([]);
        setLoading(false);
        return;
      }
  
      const vaultPromises = vaultNumbers.map(async  (vaultId: Number) => {
        console.log("Fetching details for vault ID:", vaultId.toString());
        const name = await contract.getVaultName(vaultId);
        const employeeId = await contract.getVaultEmployeID(vaultId);
        const balance = await contract.getEmployeBalance(vaultId, employeeId);
        
        console.log(`Vault ${vaultId}: Name = ${name}, Balance = ${ethers.formatEther(balance)} ETH`);
        
        return {
          id: vaultId.toString(),
          name: name,
          claimableBalance: ethers.formatEther(balance) + ' ETH'
        };
      });
  
      const vaultDetails = await Promise.all(vaultPromises);
      console.log("All vault details:", vaultDetails);
      setVaults(vaultDetails);
    } catch (error) {
      console.error("Error fetching vaults:", error);
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <p className="text-center">Loading vaults...</p>
          ) : vaults.length === 0 ? (
            <p className="text-center">You are not included in any Vault</p>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <footer className="bg-black bg-opacity-60 text-purple-200 py-4 text-center">
        <p>&copy; 2024 Vault. All rights reserved.</p>
      </footer>
    </main>
  );
}