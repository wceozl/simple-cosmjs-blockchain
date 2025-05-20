import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { Blockchain } from './blockchain';
import { Transaction } from './models';

// 钱包接口
export interface Wallet {
  address: string;
  balance: number;
}

// 区块链上下文接口
interface BlockchainContextType {
  blockchain: Blockchain;
  currentWallet: Wallet | null;
  wallets: Wallet[];
  isMining: boolean;
  miningProgress: number;
  createWallet: () => void;
  selectWallet: (address: string) => void;
  refreshBalances: () => void;
  createTransaction: (to: string, amount: number) => boolean;
  startMining: () => void;
  isChainValid: () => boolean;
}

// 创建上下文
const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

// 区块链提供者组件
export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 初始化区块链
  const [blockchain] = useState<Blockchain>(new Blockchain());
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningProgress, setMiningProgress] = useState<number>(0);
  
  // 使用ref防止初始化创建多个钱包
  const initialized = useRef(false);

  // 创建一个新钱包
  const createWallet = () => {
    // 简单实现：使用随机地址
    const newAddress = `wallet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newWallet: Wallet = {
      address: newAddress,
      balance: 0
    };
    
    setWallets(prev => [...prev, newWallet]);
    
    // 如果没有选择钱包，自动选择新创建的钱包
    if (!currentWallet) {
      setCurrentWallet(newWallet);
    }
    
    return newWallet;
  };

  // 选择一个钱包
  const selectWallet = (address: string) => {
    const wallet = wallets.find(w => w.address === address) || null;
    setCurrentWallet(wallet);
  };

  // 刷新所有钱包余额
  const refreshBalances = () => {
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      balance: blockchain.getBalanceOfAddress(wallet.address)
    }));
    
    setWallets(updatedWallets);
    
    // 更新当前钱包
    if (currentWallet) {
      const updatedCurrentWallet = updatedWallets.find(w => w.address === currentWallet.address) || null;
      setCurrentWallet(updatedCurrentWallet);
    }
  };

  // 创建交易
  const createTransaction = (to: string, amount: number): boolean => {
    if (!currentWallet) {
      alert('请先选择一个钱包');
      return false;
    }
    
    // 创建交易对象
    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: currentWallet.address,
      to: to,
      amount: amount,
      timestamp: Date.now()
    };
    
    // 添加到待处理交易
    const success = blockchain.addTransaction(transaction);
    
    if (success) {
      console.log(`交易创建成功: ${currentWallet.address} -> ${to} (${amount})`);
    } else {
      console.log('交易创建失败');
    }
    
    return success;
  };

  // 开始挖矿
  const startMining = async () => {
    if (!currentWallet) {
      alert('请先选择一个钱包');
      return;
    }
    
    if (isMining) {
      return;
    }
    
    setIsMining(true);
    setMiningProgress(0);
    
    // 模拟挖矿进度
    const interval = setInterval(() => {
      setMiningProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 300);
    
    try {
      // 在后台线程中进行挖矿（在实际应用中应使用Web Worker）
      setTimeout(() => {
        const minedBlock = blockchain.minePendingTransactions(currentWallet.address);
        
        clearInterval(interval);
        setMiningProgress(100);
        
        setTimeout(() => {
          setIsMining(false);
          setMiningProgress(0);
          
          if (minedBlock) {
            refreshBalances();
            alert(`成功挖出新区块！区块高度: ${minedBlock.index}`);
          } else {
            alert('挖矿失败，请重试！');
          }
        }, 1000);
      }, 2000);
    } catch (error) {
      clearInterval(interval);
      setIsMining(false);
      setMiningProgress(0);
      alert(`挖矿出错: ${error}`);
    }
  };

  // 验证区块链是否有效
  const isChainValid = (): boolean => {
    return blockchain.isChainValid();
  };

  // 初始化时创建一个默认钱包（仅执行一次）
  useEffect(() => {
    if (!initialized.current) {
      createWallet();
      initialized.current = true;
    }
  }, []);

  // 提供上下文值
  const contextValue: BlockchainContextType = {
    blockchain,
    currentWallet,
    wallets,
    isMining,
    miningProgress,
    createWallet,
    selectWallet,
    refreshBalances,
    createTransaction,
    startMining,
    isChainValid
  };

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
};

// 使用区块链上下文的自定义钩子
export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  
  if (context === undefined) {
    throw new Error('useBlockchain必须在BlockchainProvider内部使用');
  }
  
  return context;
};