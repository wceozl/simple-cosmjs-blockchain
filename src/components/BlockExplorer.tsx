import React, { useState } from 'react';
import { useBlockchain, Block, Transaction } from '../blockchain';

const BlockExplorer: React.FC = () => {
  const { blockchain, isChainValid } = useBlockchain();
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  
  const chain = blockchain.getChain();
  const chainValid = isChainValid();

  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // 显示部分哈希值
  const formatHash = (hash: string): string => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  // 计算区块大小（粗略估计）
  const calculateBlockSize = (block: Block): number => {
    const blockString = JSON.stringify(block);
    return new Blob([blockString]).size;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">区块链浏览器</h2>
      
      {/* 链状态信息 */}
      <div className="mb-4 p-3 border rounded bg-blue-50">
        <p>
          <span className="font-semibold">区块链长度:</span> {chain.length} 个块
        </p>
        <p>
          <span className="font-semibold">链状态:</span> 
          {chainValid 
            ? <span className="text-green-600 font-semibold"> 有效</span> 
            : <span className="text-red-600 font-semibold"> 无效</span>}
        </p>
      </div>
      
      {/* 区块列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {chain.map((block, index) => (
          <div
            key={index}
            className={`p-3 border rounded cursor-pointer ${
              selectedBlock?.hash === block.hash 
                ? 'bg-blue-100 border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedBlock(block)}
          >
            <p className="font-semibold">区块 #{block.index}</p>
            <p className="text-xs">哈希: {formatHash(block.hash)}</p>
            <p className="text-xs">上一个区块: {formatHash(block.previousHash)}</p>
            <p className="text-xs">时间: {formatTimestamp(block.timestamp)}</p>
            <p className="text-xs">交易数: {block.transactions.length}</p>
            <p className="text-xs">nonce: {block.nonce}</p>
          </div>
        ))}
      </div>
      
      {/* 区块详情 */}
      {selectedBlock && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">区块详情:</h3>
          
          <div className="mb-4 p-3 border rounded">
            <p className="font-semibold">区块 #{selectedBlock.index}</p>
            <p className="text-sm break-all">
              <span className="font-semibold">哈希:</span> {selectedBlock.hash}
            </p>
            <p className="text-sm break-all">
              <span className="font-semibold">上一个区块:</span> {selectedBlock.previousHash}
            </p>
            <p className="text-sm">
              <span className="font-semibold">生成时间:</span> {formatTimestamp(selectedBlock.timestamp)}
            </p>
            <p className="text-sm">
              <span className="font-semibold">难度:</span> {selectedBlock.difficulty}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Nonce:</span> {selectedBlock.nonce}
            </p>
            <p className="text-sm">
              <span className="font-semibold">大小:</span> ~{calculateBlockSize(selectedBlock)} bytes
            </p>
            <p className="text-sm">
              <span className="font-semibold">包含交易:</span> {selectedBlock.transactions.length} 笔
            </p>
          </div>
          
          {/* 区块中的交易列表 */}
          <h3 className="font-semibold mb-2">交易列表:</h3>
          
          <div className="max-h-60 overflow-y-auto">
            {selectedBlock.transactions.length === 0 ? (
              <p className="text-gray-500">此区块不包含任何交易</p>
            ) : (
              selectedBlock.transactions.map((tx: Transaction, txIndex: number) => (
                <div key={txIndex} className="mb-2 p-2 border rounded text-sm">
                  <p className="text-xs"><span className="font-semibold">ID:</span> {tx.id}</p>
                  <p className="text-xs break-all"><span className="font-semibold">从:</span> {tx.from}</p>
                  <p className="text-xs break-all"><span className="font-semibold">到:</span> {tx.to}</p>
                  <p><span className="font-semibold">金额:</span> {tx.amount} 个币</p>
                  <p className="text-xs"><span className="font-semibold">时间:</span> {formatTimestamp(tx.timestamp)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* 区块链说明 */}
      <div className="mt-4 p-3 border rounded bg-gray-50 text-sm">
        <p className="font-semibold">区块链知识:</p>
        <ul className="list-disc list-inside mt-1">
          <li>区块链是由一系列区块组成的公共账本</li>
          <li>每个区块包含一组交易和上一个区块的哈希值</li>
          <li>创世区块是第一个区块，没有前置区块</li>
          <li>区块链通过哈希链接保证数据完整性和不可篡改性</li>
          <li>最长链原则是区块链系统的共识机制之一</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockExplorer;