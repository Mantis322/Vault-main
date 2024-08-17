"use client"; 

import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  walletAddress: string;
  provider: BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      } catch (error) {
        console.error("Cüzdan bağlantısı başarısız oldu:", error);
      }
    } else {
      console.error("MetaMask yüklü değil!");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
  };

  return (
    <WalletContext.Provider value={{ walletAddress, provider, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};