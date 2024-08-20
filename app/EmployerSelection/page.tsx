"use client";
import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/WalletContext';
import { CONTRACT_ABI } from '../../hooks/WalletABI';
import { CONTRACT_ADDRESS } from '../../hooks/ContractAdress';

export default function EmployerVaultSelection() {
  const [selectedVault, setSelectedVault] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showVaultDetailsModal, setShowVaultDetailsModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [creationStatus, setCreationStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const [createdVaultName, setCreatedVaultName] = useState('');
  const { walletAddress, provider, connectWallet, disconnectWallet } = useWallet();
  const [vaults, setVaults] = useState<Array<{ id: string, name: string, balance: string, totalAllocated: string}>>([]);

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

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log("Calling getEmployeerVaultNumbers for address:", walletAddress);
      const vaultNumbers = await contract.getEmployerVaultNumbers();
      console.log("Received vault numbers:", vaultNumbers);
  
      if (vaultNumbers.length === 0) {
        console.log("No vaults found for this employer");
        setVaults([]);
        return;
      }
  
      const vaultPromises = vaultNumbers.map(async (vaultId: Number) => {
        console.log("Fetching details for vault ID:", vaultId.toString());
        const name = await contract.getVaultName(vaultId);
        const balance = await contract.getTotalDeposit(vaultId);
        const totalAllocated = await contract.getTotalAllocated(vaultId);
        
        console.log(`Vault ${vaultId}: Name = ${name}, Balance = ${ethers.formatEther(balance)} EDU`);
      
          return {
            id: vaultId.toString(),
            name: name,
            balance: ethers.formatEther(balance).toString(),
            totalAllocated: ethers.formatEther(balance).toString()
          };
        
        
      });
  
      const vaultDetails = (await Promise.all(vaultPromises)).filter(vault => vault !== null);
      console.log("All vault details:", vaultDetails);
      setVaults(vaultDetails);
    } catch (error) {
      console.error("Error fetching vaults:", error);
    }

  };

  const handleCreateVault = () => {
    // Simulate vault creation with 50% success rate
    const isSuccess = Math.random() < 0.5;
    setCreationStatus(isSuccess ? 'success' : 'fail');
    
    if (isSuccess) {
      // Store the created vault name
      setCreatedVaultName(newVaultName);
      // In a real application, you would add the new vault to the list here
      setNewVaultName('');
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      setCreationStatus('idle');
      setCreatedVaultName('');
    }, 3000);
  };

  const handleVaultDetailsModal = () => {
    setShowVaultDetailsModal(true);
  };

  const handleCloseVaultDetailsModal = () => {
    setShowVaultDetailsModal(false);
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

        .success-galaxy {
          background-image: 
            radial-gradient(#50fa7b, rgba(80,250,123,.2) 2px, transparent 40px),
            radial-gradient(#50fa7b, rgba(80,250,123,.15) 1px, transparent 30px),
            radial-gradient(#50fa7b, rgba(80,250,123,.1) 2px, transparent 40px),
            radial-gradient(rgba(80,250,123,.4), rgba(80,250,123,.1) 2px, transparent 30px);
        }
      `}</style>
      
      <header className="flex justify-between items-center p-6 bg-black bg-opacity-60 backdrop-blur-sm">
      <Link href="/">
        <h1 className="text-4xl font-bold tracking-wider text-purple-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          VAULT
          </h1>
          </Link>
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
        <h2 className="text-3xl font-semibold mb-8 text-center">Select or Create Employer Vault</h2>
        {vaults.length > 0 ? (
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
                <p className="text-gray-300">Total Deposit: {vault.balance} EDU</p>
              </div>
            ))}
            <div className="flex justify-between mt-6">
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => setShowModal(true)}
              >
                + Create New Vault
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedVault 
                    ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                onClick={handleVaultDetailsModal}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-black bg-opacity-70 p-6 rounded-lg text-center">
            <p>You don't have any Vaults yet. You can create a new Vault using the "Create New Vault" button.</p>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mt-4"
              onClick={() => setShowModal(true)}
            >
              Create New Vault
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`bg-gray-900 p-8 rounded-lg w-96 ${creationStatus === 'success' ? 'success-galaxy' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Create New Vault</h3>
              <button onClick={() => {setShowModal(false); setCreationStatus('idle'); setCreatedVaultName('');}} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            {creationStatus === 'idle' && (
              <>
                <input 
                  type="text" 
                  placeholder="Enter vault name" 
                  className="w-full p-2 mb-4 bg-gray-800 text-white rounded"
                  value={newVaultName}
                  onChange={(e) => setNewVaultName(e.target.value)}
                />
                <button 
                  className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                  onClick={handleCreateVault}
                >
                  Create
                </button>
              </>
            )}
            {creationStatus === 'success' && (
              <p className="text-green-400">Vault "{createdVaultName}" created successfully!</p>
            )}
            {creationStatus === 'fail' && (
              <p className="text-red-400">Failed to create vault. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {showVaultDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Vault Details</h3>
              <button onClick={handleCloseVaultDetailsModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Vault Name:</p>
              <p className="text-white">{vaults.find(vault => vault.id === selectedVault)?.name}</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Total Deposit:</p>
              <p className="text-white">{vaults.find(vault => vault.id === selectedVault)?.balance} EDU</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Withdrawable Amount:</p>
              <p className="text-white">{vaults.find(vault => vault.id === selectedVault)?.balance} EDU</p>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Allocated Amount:</p>
              <p className="text-white">{vaults.find(vault => vault.id === selectedVault)?.totalAllocated} EDU</p>
            </div>
            <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
              Operations
            </button>
          </div>
        </div>
      )}

      <footer className="bg-black bg-opacity-60 text-purple-200 py-4 text-center">
        <p>&copy; 2024 Vault. All rights reserved.</p>
      </footer>
    </main>
  );
}
