"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '../hooks/WalletContext';




export default function Home() {
  const [hoveredSection, setHoveredSection] = useState<'employer' | 'employee' | null>(null);
  const { walletAddress, connectWallet, disconnectWallet } = useWallet();

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

        .section-hover {
          transition: all 0.3s ease-in-out;
        }

        .section-hover:hover {
          background-color: rgba(128, 0, 128, 0.2);
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

      <div className="flex-1 flex">
        <Link href="/EmployerSelection" className="w-1/2 group">
          <section
            className="h-full p-12 flex flex-col justify-center items-center galaxy-bg section-hover cursor-pointer"
            onMouseEnter={() => setHoveredSection('employer')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2 className="text-4xl font-semibold mb-6 transition-all duration-300 group-hover:text-purple-400">
              Scholarship & Salary Handling
            </h2>
            <p className="text-center max-w-md">
              Manage scholarships and teacher payments securely and transparently with blockchain technology.
              See the impact of your contributions instantly.
            </p>
            <span className="mt-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to continue →
            </span>
          </section>
        </Link>

        <div className="w-px bg-purple-500 self-stretch my-12"></div>

        <Link href="/EmployeeSelection" className="w-1/2 group">
          <section
            className="h-full p-12 flex flex-col justify-center items-center galaxy-bg section-hover cursor-pointer"
            onMouseEnter={() => setHoveredSection('employee')}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2 className="text-4xl font-semibold mb-6 transition-all duration-300 group-hover:text-purple-400">
              Student / Teacher
            </h2>
            <p className="text-center max-w-md">
              Claim your scholarships or payments instantly and securely. Track your earnings
              and manage your finances with ease.
            </p>
            <span className="mt-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Click to continue →
            </span>
          </section>
        </Link>
      </div>

      <footer className="bg-black bg-opacity-60 text-purple-200 py-4 text-center">
        <p>&copy; 2024 Vault. All rights reserved.</p>
      </footer>
    </main>
  );
}