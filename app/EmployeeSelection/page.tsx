"use client";
import { useState, useEffect } from 'react';
import Image from "next/image";
import { useWallet } from '../../hooks/WalletContext';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../hooks/WalletABI';
import { CONTRACT_ADDRESS } from '../../hooks/ContractAdress';
import Link from 'next/link';

export default function EmployeeSelection() {
  const [selectedVault, setSelectedVault] = useState('');
  const [vaults, setVaults] = useState<Array<{ id: string, name: string, claimableBalance: string, claimableBalanceWei: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const { walletAddress, provider, connectWallet, disconnectWallet } = useWallet();
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (walletAddress && provider) {
      fetchVaults();
      fetchBalance();
    }
  }, [walletAddress, provider]);

  const fetchBalance = async () => {
    if (provider && walletAddress) {
      try {
        const balance = await provider.getBalance(walletAddress);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };

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

      const vaultPromises = vaultNumbers.map(async (vaultId: Number) => {
        console.log("Fetching details for vault ID:", vaultId.toString());
        const name = await contract.getVaultName(vaultId);
        const employeeId = await contract.getVaultEmployeeID(vaultId);
        const balance = await contract.getEmployeeBalance(vaultId, employeeId);

        console.log(`Vault ${vaultId}: Name = ${name}, Balance = ${ethers.formatEther(balance)} EDU`);


        if (Number(ethers.formatEther(balance)) > 0) {
          return {
            id: vaultId.toString(),
            name: name,
            claimableBalance: ethers.formatEther(balance) + ' EDU',
            claimableBalanceWei: balance.toString()
          };
        }
        return null;
      });

      const vaultDetails = (await Promise.all(vaultPromises)).filter(vault => vault !== null);
      console.log("All vault details:", vaultDetails);
      setVaults(vaultDetails);
    } catch (error) {
      console.error("Error fetching vaults:", error);
    } finally {
      setLoading(false);
    }

    await fetchBalance();
  };

  const addOpenCampusNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xa045c',
            chainName: 'Open Campus Codex Sepolia',
            nativeCurrency: {
              name: 'EDU',
              symbol: 'EDU',
              decimals: 18
            },
            rpcUrls: ['https://open-campus-codex-sepolia.drpc.org'],
            blockExplorerUrls: ['https://opencampus-codex.blockscout.com']
          }]
        });
        console.log('Open Campus network added to MetaMask');
      } catch (error) {
        console.error('Failed to add Open Campus network:', error);
      }
    } else {
      console.log('MetaMask is not installed');
    }
  };

  const handleClaim = async () => {
    if (!provider || !walletAddress || !selectedVault) {
      console.log("Provider, wallet address or selected vault is missing");
      return;
    }

    setClaimLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const selectedVaultData = vaults.find(v => v.id === selectedVault);
      if (!selectedVaultData) {
        throw new Error("Selected vault data not found");
      }

      const employeeId = await contract.getVaultEmployeeID(selectedVault);
      console.log("Employee ID:", employeeId.toString());

      const tx = await contract.employeeWithdraw(
        selectedVault,
        selectedVaultData.claimableBalanceWei,
        employeeId
      );

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      // Refresh vaults after successful claim
      await fetchVaults();
    } catch (error) {
      console.error("Error claiming:", error);
    } finally {
      setClaimLoading(false);
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
        <Link href="/">
          <h1 className="text-4xl font-bold tracking-wider text-purple-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            VAULT
          </h1>
        </Link>
        {walletAddress ? (
          <div className="flex items-center">

            <span className="mr-4 text-purple-300">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${parseFloat(balance).toFixed(4)} EDU`}</span>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              onClick={disconnectWallet}
            >
              Disconnect
            </button>&nbsp;&nbsp;

            <button
              className="mr-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              onClick={addOpenCampusNetwork}
            >
              Connect OC Network
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
        <h2 className="text-3xl font-semibold mb-8 text-center">Select Vault to Claim</h2>
        <div className="max-w-2xl mx-auto bg-black bg-opacity-70 p-6 rounded-lg">
          {loading ? (
            <p className="text-center">Loading vaults...</p>
          ) : vaults.length === 0 ? (
            <p className="text-center">You don't have any claimable balance in any Vault</p>
          ) : (
            <>
              {vaults.map((vault) => (
                <div
                  key={vault.id}
                  className={`p-4 mb-4 rounded-lg cursor-pointer transition-all ${selectedVault === vault.id
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
                className={`w-full mt-6 py-2 rounded-lg transition-colors ${selectedVault && !claimLoading
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-600 cursor-not-allowed'
                  }`}
                disabled={!selectedVault || claimLoading}
                onClick={handleClaim}
              >
                {claimLoading ? 'Claiming...' : 'Claim'}
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