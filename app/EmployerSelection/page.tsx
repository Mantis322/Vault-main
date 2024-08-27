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
  const [vaults, setVaults] = useState<Array<{ id: string, name: string, balance: string, totalAllocated: string }>>([]);
  const [nameError, setNameError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateAddress, setAllocateAddress] = useState('');
  const [depositError, setDepositError] = useState('');
  const [allocateError, setAllocateError] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdraw, setIsWithdrawing] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [processStatus, setProcessStatus] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
      return;
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const vaultNumbers = await contract.getEmployerVaultNumbers();

      if (vaultNumbers.length === 0) {
        setVaults([]);
        return;
      }

      const vaultPromises = vaultNumbers.map(async (vaultId: Number) => {
        const name = await contract.getVaultName(vaultId);
        const balance = await contract.getTotalDeposit(vaultId);
        const totalAllocated = await contract.getTotalAllocated(vaultId);

        console.log(`Vault ${vaultId}: Name = ${name}, Balance = ${ethers.formatEther(balance)} EDU`);

        return {
          id: vaultId.toString(),
          name: name,
          balance: ethers.formatEther(balance).toString(),
          totalAllocated: ethers.formatEther(totalAllocated).toString()
        };
      });

      const vaultDetails = (await Promise.all(vaultPromises)).filter(vault => vault !== null);

      setVaults(vaultDetails);
    } catch (error) {
      console.error("Error fetching vaults:", error);
    }

    await fetchBalance();
  };

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) {
      setNameError('Please enter a vault name');
      return;
    }

    setNameError('');

    if (!provider || !walletAddress) {
      console.log("Provider or wallet address is missing");
      return;
    }
    let vaultCreation;

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      vaultCreation = await contract.createNewVault(newVaultName);

    } catch (error) {
      console.error("Error fetching vaults:", error);
    }

    await vaultCreation.wait();
    setCreationStatus(vaultCreation ? 'success' : 'fail');

    if (vaultCreation) {

      setCreatedVaultName(newVaultName);

      setNewVaultName('');

      setTimeout(() => {
        setShowModal(false);
        setCreationStatus('idle');
        setCreatedVaultName('');
      }, 2000); // 2 seconds delay
    } else {
      // For failed creation, reset after 3 seconds
      setTimeout(() => {
        setCreationStatus('idle');
        setCreatedVaultName('');
      }, 3000);
    }
    fetchVaults();
  };

  const resetModal = () => {
    setShowModal(false);
    setCreationStatus('idle');
    setCreatedVaultName('');
    setNewVaultName('');
    setNameError('');
  };

  const handleVaultDetailsModal = () => {
    setShowVaultDetailsModal(true);
  };

  const handleCloseVaultDetailsModal = () => {
    setShowVaultDetailsModal(false);
  };

  const handleWithdraw = async () => {
    const selectedVaultBalance = parseFloat(vaults.find(vault => vault.id === selectedVault)?.balance || '0');

    if (parseFloat(withdrawAmount) > selectedVaultBalance) {
      setWithdrawError('Cannot withdraw more than the available balance.');
      return;
    }

    setIsWithdrawing(true);

    if (!provider || !walletAddress) {
      setAllocateError('An error occurred during the process. Please try again.');
      return;
    }
    let employerWithdrawFromContract;

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      employerWithdrawFromContract = await contract.employerWithdraw(selectedVault, ethers.parseEther(withdrawAmount));

      await employerWithdrawFromContract.wait()


      setWithdrawAmount('');
      setWithdrawError('');

      await fetchVaults();


      const updatedSelectedVault = vaults.find(vault => vault.id === selectedVault);
      if (updatedSelectedVault) {
        setSelectedVault(updatedSelectedVault.id);
      }

    } catch (error) {
      setAllocateError('An error occurred during the process. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }


    console.log(`Withdrawing ${withdrawAmount} EDU from ${vaults.find(vault => vault.id === selectedVault)?.name}`);
  };

  const handleDeposit = async () => {

    setIsDepositing(true);

    if (!provider || !walletAddress) {
      setDepositError('An error occurred during the process. Please try again.');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);


      const transaction = await contract.deposit(selectedVault, { value: ethers.parseEther(depositAmount) });


      await transaction.wait();

      console.log(`Deposited ${depositAmount} EDU to ${vaults.find(vault => vault.id === selectedVault)?.name}`);


      await fetchVaults();

      setDepositAmount('');


      const updatedSelectedVault = vaults.find(vault => vault.id === selectedVault);
      if (updatedSelectedVault) {
        setSelectedVault(updatedSelectedVault.id);
      }

    } catch (error) {
      setDepositError('An error occurred during the process. Please try again.');

    } finally {
      setIsDepositing(false);
    }
  };


  const handleAllocate = async () => {
    setIsAllocating(true);
    setAllocateError('');

    if (!provider || !walletAddress) {
      setAllocateError('An error occurred during the process. Please try again.');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProcessStatus('Checking employee status...');
      const employees = await contract.getEmploye(selectedVault);
      const isEmployeeExists = employees.some((emp: { employee_address: string; }) => emp.employee_address.toLowerCase() === allocateAddress.toLowerCase());

      if (!isEmployeeExists) {
        setShowConfirmModal(true);
        setIsAllocating(false);
        return;
      }

      await performAllocation(contract);

    } catch (error) {
      setAllocateError('An error occurred during the process. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  };

  const addEmployee = async () => {
    setShowConfirmModal(false);
    setIsAllocating(true);
    if (!provider || !walletAddress) {
      console.log("Provider or wallet address is missing");
      return;
    }

    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProcessStatus("Adding employee to the vault...")
      
      const addEmployeeTx = await contract.addEmployee(selectedVault, allocateAddress);
      await addEmployeeTx.wait();
      
      await performAllocation(contract);

    } catch (error) {
      setAllocateError('An error occurred during the process. Please try again.');
    } finally {
      setIsAllocating(false);
      setProcessStatus('');
    }

  }

  const performAllocation = async (contract: ethers.Contract) => {
    setProcessStatus('Allocating funds...');
    try {
      // Önce employeeId'yi alalım
      const employeeId = await contract.getVaultEmployeIDForEmployer(selectedVault, allocateAddress);
      console.log('Employee ID:', employeeId.toString()); // ID'yi konsola yazdırıyoruz
  
      // Şimdi allocateToEmployee fonksiyonunu çağıralım
      const allocateTx = await contract.allocateToEmployee(
        selectedVault,
        ethers.parseEther(allocateAmount),
        employeeId
      );
      
      // İşlem onayını bekleyelim
      await allocateTx.wait();
  
      console.log(`Allocated ${allocateAmount} EDU to ${allocateAddress} from ${vaults.find(vault => vault.id === selectedVault)?.name}`);
  
      // Vaultları yeniden yükleyelim
      await fetchVaults();
  
      // State'i temizleyelim
      setAllocateAmount('');
      setAllocateAddress('');
  
      // Seçili vault'u güncelleyelim
      const updatedSelectedVault = vaults.find(vault => vault.id === selectedVault);
      if (updatedSelectedVault) {
        setSelectedVault(updatedSelectedVault.id);
      }
    } catch (error) {
      console.error('Allocation error:', error);
      setAllocateError('An error occurred during allocation. Please check the console for details.');
    } finally {
      setProcessStatus('');
    }
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
        <h2 className="text-3xl font-semibold mb-8 text-center">Select or Create Vault</h2>
        {vaults.length > 0 ? (
          <div className="max-w-2xl mx-auto bg-black bg-opacity-70 p-6 rounded-lg">
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
                className={`px-4 py-2 rounded-lg transition-colors ${selectedVault
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-gray-900 p-8 rounded-lg w-96 ${creationStatus === 'success' ? 'success-galaxy' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-purple-400">Create New Vault</h3>
              <button onClick={resetModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            {creationStatus === 'idle' && (
              <>
                <input
                  type="text"
                  placeholder="Enter vault name"
                  className={`w-full p-2 mb-2 bg-gray-800 text-white rounded border ${nameError ? 'border-red-500' : 'border-purple-500'
                    } focus:outline-none focus:border-purple-700`}
                  value={newVaultName}
                  onChange={(e) => {
                    setNewVaultName(e.target.value);
                    setNameError('');
                  }}
                />
                {nameError && <p className="text-red-500 text-sm mb-2">{nameError}</p>}
                <button
                  className={`w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors ${!newVaultName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  onClick={handleCreateVault}
                  disabled={!newVaultName.trim()}
                >
                  Create
                </button>
              </>
            )}
            {creationStatus === 'success' && (
              <p className="text-green-400 text-center">Vault "{createdVaultName}" created successfully!</p>
            )}
            {creationStatus === 'fail' && (
              <p className="text-red-400 text-center">Failed to create vault. Please try again.</p>
            )}
          </div>
        </div>
      )}

      {showVaultDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg w-96 border border-purple-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-purple-400">Vault Details</h3>
              <button onClick={handleCloseVaultDetailsModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-400 mb-1">Vault Name: {vaults.find(vault => vault.id === selectedVault)?.name}</p>
              <p className="text-gray-400 mb-1">Total Deposit: {vaults.find(vault => vault.id === selectedVault)?.balance} EDU</p>
              <p className="text-gray-400 mb-1">Withdrawable Amount: {vaults.find(vault => vault.id === selectedVault)?.balance} EDU</p>
              <p className="text-gray-400 mb-1">Allocated Amount: {vaults.find(vault => vault.id === selectedVault)?.totalAllocated} EDU</p>
            </div>
            {/* Withdraw Section */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Withdraw</h4>
              <input
                type="number"
                className="w-full p-2 bg-gray-800 rounded-lg text-white mb-2"
                value={withdrawAmount}
                onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError('') }}
                placeholder="Enter amount to withdraw (EDU)"
              />
              {withdrawError && <p className="text-red-500 text-sm mb-2">{withdrawError}</p>}
              <button
                className={`w-full text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-500 ${withdrawError ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                onClick={handleWithdraw}
                disabled={!!withdrawError || isWithdraw}
              >
                {isWithdraw ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>

            {/* Deposit Section */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Deposit</h4>
              <input
                type="number"
                className="w-full p-2 bg-gray-800 rounded-lg text-white mb-2"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount to deposit (EDU)"
              />
              {depositError && <p className="text-red-500 mb-2">{depositError}</p>}
              <button
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-500"
                onClick={handleDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </button>
            </div>

            {/* Allocate Section */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">Allocate</h4>
              <input
                type="text"
                className="w-full p-2 bg-gray-800 rounded-lg text-white mb-2"
                value={allocateAddress}
                onChange={(e) => setAllocateAddress(e.target.value)}
                placeholder="Enter address to allocate"
              />
              <input
                type="number"
                className="w-full p-2 bg-gray-800 rounded-lg text-white mb-2"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                placeholder="Enter amount to allocate (EDU)"
              />
              {allocateError && <p className="text-red-500 mb-2">{allocateError}</p>}
              <button
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-500"
                onClick={handleAllocate}
                disabled={isAllocating}
              >
                {isAllocating ? processStatus : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg w-96 border border-purple-500">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">Confirm Action</h3>
            <p className="text-white mb-6">
              This address has not been added to the vault yet. Do you want to add it and then allocate funds? This will require two separate transactions.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={addEmployee}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-black bg-opacity-60 text-purple-200 py-4 text-center">
        <p>&copy; 2024 Vault. All rights reserved.</p>
      </footer>
    </main>
  );
}