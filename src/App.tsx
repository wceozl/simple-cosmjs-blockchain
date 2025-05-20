import React from 'react';
import { BlockchainProvider } from './blockchain';
import { Wallet, Mining, BlockExplorer } from './components';

function App() {
  return (
    <BlockchainProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-2xl font-bold text-center">简易区块链应用</h1>
        </header>
        
        <main className="container mx-auto p-4">
          <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">欢迎使用区块链学习项目</h2>
            <p className="mb-2">
              这是一个用CosmJS实现的简单区块链应用，您可以通过本应用来学习和理解区块链的基本原理。
            </p>
            <p>
              您可以创建钱包、发送交易、挖矿以及浏览区块链数据，体验区块链技术的核心概念。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Wallet />
            <Mining />
          </div>
          
          <div className="mb-4">
            <BlockExplorer />
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">区块链基本原理解析</h2>
            
            <div className="mb-3">
              <h3 className="font-semibold">1. 区块结构</h3>
              <p>区块链由一个个区块连接而成，每个区块包含：</p>
              <ul className="list-disc list-inside ml-4">
                <li>区块索引(高度)</li>
                <li>时间戳</li>
                <li>交易列表</li>
                <li>上一个区块的哈希值</li>
                <li>当前区块的哈希值</li>
                <li>挖矿难度和随机数(nonce)</li>
              </ul>
            </div>
            
            <div className="mb-3">
              <h3 className="font-semibold">2. 挖矿机制</h3>
              <p>本项目使用工作量证明(Proof of Work)挖矿机制：</p>
              <ul className="list-disc list-inside ml-4">
                <li>矿工不断尝试不同的nonce值</li>
                <li>目标是找到一个使得区块哈希值前N位为0的nonce</li>
                <li>N由难度系数决定，难度越高，挖矿越困难</li>
                <li>挖矿成功的矿工将获得系统奖励的代币</li>
              </ul>
            </div>
            
            <div className="mb-3">
              <h3 className="font-semibold">3. 交易系统</h3>
              <p>区块链上的交易包含：</p>
              <ul className="list-disc list-inside ml-4">
                <li>交易ID</li>
                <li>发送方地址</li>
                <li>接收方地址</li>
                <li>交易金额</li>
                <li>时间戳</li>
                <li>在实际系统中还需数字签名</li>
              </ul>
            </div>
            
            <div className="mb-3">
              <h3 className="font-semibold">4. 最长链原则</h3>
              <p>这是区块链系统的基本共识机制之一：</p>
              <ul className="list-disc list-inside ml-4">
                <li>如果出现链的分叉，系统会选择最长的链作为正确的链</li>
                <li>这确保了在分布式系统中的共识</li>
                <li>要篡改区块链数据，攻击者需要控制超过50%的计算能力</li>
              </ul>
            </div>
          </div>
        </main>
        
        <footer className="bg-gray-200 p-4 mt-8 text-center text-gray-600">
          <p>简易区块链学习项目 - 使用CosmJS、React和TypeScript构建</p>
        </footer>
      </div>
    </BlockchainProvider>
  );
}

export default App;