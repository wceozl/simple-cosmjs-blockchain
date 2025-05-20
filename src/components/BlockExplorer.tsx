import React, { useState, useEffect } from 'react';
import { useBlockchain, Block, Transaction, calculateBlockHash } from '../blockchain';

const BlockExplorer: React.FC = () => {
  const { blockchain, isChainValid, currentWallet, refreshBalances } = useBlockchain();
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [chain, setChain] = useState<Block[]>([]);
  const [chainValid, setChainValid] = useState<boolean>(true);
  const [isForkingInProgress, setIsForkingInProgress] = useState<boolean>(false);
  const [forkProgress, setForkProgress] = useState<string>('');
  
  // 定期刷新区块链数据
  useEffect(() => {
    const updateChainData = () => {
      setChain(blockchain.getChain());
      setChainValid(isChainValid());
    };
    
    updateChainData();
    const interval = setInterval(updateChainData, 2000);
    return () => clearInterval(interval);
  }, [blockchain, isChainValid]);

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

  // 模拟区块链分叉和触发最长链原则
  const simulateFork = async () => {
    if (!currentWallet || chain.length < 3 || isForkingInProgress) {
      alert(chain.length < 3 ? '需要至少3个区块才能模拟分叉' : '请先选择一个钱包或等待当前操作完成');
      return;
    }

    setIsForkingInProgress(true);
    
    try {
      // 步骤1: 创建当前链的副本
      setForkProgress('1/4 - 创建分叉链...');
      const currentChain = [...chain];
      const forkChain = JSON.parse(JSON.stringify(currentChain.slice(0, -1))); // 复制除最后一个区块外的所有区块
      
      // 步骤2: 在分叉链上创建新区块
      setForkProgress('2/4 - 准备在分叉上挖矿...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 仿真延迟
      
      // 手动在分叉链上创建新区块
      const minerAddress = currentWallet.address;
      
      // 在分叉上添加两个区块，使其比原链更长
      setForkProgress('3/4 - 在分叉上创建新区块...');
      
      // 创建交易（自己转给自己，简单起见）
      const transaction: Transaction = {
        id: `fork-tx-${Date.now()}`,
        from: minerAddress,
        to: minerAddress,
        amount: 1,
        timestamp: Date.now()
      };
      
      // 创建第一个新区块
      const lastBlock = forkChain[forkChain.length - 1];
      const newBlock1Data = {
        index: lastBlock.index + 1,
        timestamp: Date.now(),
        transactions: [
          transaction,
          {
            id: `reward-fork-${Date.now()}`,
            from: '系统',
            to: minerAddress,
            amount: 100,
            timestamp: Date.now()
          }
        ],
        previousHash: lastBlock.hash,
        nonce: 0,
        difficulty: lastBlock.difficulty
      };
      
      // 手动计算满足难度的哈希
      let hash1 = '';
      let nonce1 = 0;
      const targetPrefix = Array(newBlock1Data.difficulty + 1).join('0');
      
      while(true) {
        newBlock1Data.nonce = nonce1;
        hash1 = calculateBlockHash(newBlock1Data);
        if (hash1.startsWith(targetPrefix)) break;
        nonce1++;
        if (nonce1 > 1000) break; // 限制循环次数，避免界面卡死
      }
      
      const newBlock1 = {
        ...newBlock1Data,
        hash: hash1
      };
      
      forkChain.push(newBlock1);
      
      // 创建第二个新区块
      const newBlock2Data = {
        index: newBlock1.index + 1,
        timestamp: Date.now(),
        transactions: [
          {
            id: `reward-fork-2-${Date.now()}`,
            from: '系统',
            to: minerAddress,
            amount: 100,
            timestamp: Date.now()
          }
        ],
        previousHash: newBlock1.hash,
        nonce: 0,
        difficulty: newBlock1.difficulty
      };
      
      // 手动计算满足难度的哈希
      let hash2 = '';
      let nonce2 = 0;
      
      while(true) {
        newBlock2Data.nonce = nonce2;
        hash2 = calculateBlockHash(newBlock2Data);
        if (hash2.startsWith(targetPrefix)) break;
        nonce2++;
        if (nonce2 > 1000) break; // 限制循环次数，避免界面卡死
      }
      
      const newBlock2 = {
        ...newBlock2Data,
        hash: hash2
      };
      
      forkChain.push(newBlock2);
      
      // 步骤3: 将分叉链添加到已知链中
      setForkProgress('4/4 - 触发最长链原则...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 仿真延迟
      
      // 将分叉链添加到区块链中，触发最长链选择
      blockchain.addKnownChain(forkChain);
      
      // 刷新界面显示
      refreshBalances();
      setChain(blockchain.getChain());
      setChainValid(isChainValid());
      
      alert('成功模拟了区块链分叉并触发了最长链原则！\n' + 
            '系统自动选择了更长的链作为有效链。\n' + 
            '查看区块链列表，您会发现区块已经变化。');
      
    } catch (error) {
      console.error('分叉模拟失败:', error);
      alert('模拟分叉过程出错，请查看控制台获取详细信息。');
    } finally {
      setIsForkingInProgress(false);
      setForkProgress('');
    }
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
        
        {/* 添加模拟分叉按钮 */}
        <div className="mt-3">
          <button
            onClick={simulateFork}
            disabled={isForkingInProgress || !currentWallet || chain.length < 3}
            className={`px-4 py-2 rounded ${
              isForkingInProgress || !currentWallet || chain.length < 3
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isForkingInProgress ? `模拟分叉中... ${forkProgress}` : '模拟区块链分叉'}
          </button>
          <p className="text-xs mt-1 text-gray-600">
            (需要至少3个区块才能模拟分叉，点击后将创建一个比当前链更长的分叉链)
          </p>
        </div>
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
        <p className="font-semibold">最长链原则说明:</p>
        <ul className="list-disc list-inside mt-1">
          <li>最长链原则是区块链系统重要的共识机制</li>
          <li>当区块链出现分叉时，网络自动接受最长的有效链</li>
          <li>这确保了在分布式系统中所有节点最终达成一致</li>
          <li>分叉通常发生在两个矿工几乎同时发现新区块时</li>
          <li>攻击者需要控制超过网络51%的算力才能篡改链</li>
          <li>链越长，被篡改的可能性越小，安全性越高</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockExplorer;