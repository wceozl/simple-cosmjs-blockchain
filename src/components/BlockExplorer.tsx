import React, { useState, useEffect } from 'react';
import { useBlockchain, Block, Transaction, calculateBlockHash } from '../blockchain';

const BlockExplorer: React.FC = () => {
  const { blockchain, isChainValid, currentWallet, refreshBalances } = useBlockchain();
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [forkBlock, setForkBlock] = useState<Block | null>(null);
  const [chain, setChain] = useState<Block[]>([]);
  const [chainValid, setChainValid] = useState<boolean>(true);
  const [isForkingInProgress, setIsForkingInProgress] = useState<boolean>(false);
  const [forkProgress, setForkProgress] = useState<string>('');
  const [showForkHelp, setShowForkHelp] = useState<boolean>(false);
  
  // 定期刷新区块链数据
  useEffect(() => {
    const updateChainData = () => {
      const currentChain = blockchain.getChain();
      setChain(currentChain);
      setChainValid(isChainValid());
      
      // 如果选择的区块不在当前链中，重置选择
      if (selectedBlock && !currentChain.some(block => block.hash === selectedBlock.hash)) {
        setSelectedBlock(null);
      }
      
      // 同样重置分叉块的选择
      if (forkBlock && !currentChain.some(block => block.hash === forkBlock.hash)) {
        setForkBlock(null);
      }
    };
    
    updateChainData();
    const interval = setInterval(updateChainData, 2000);
    return () => clearInterval(interval);
  }, [blockchain, isChainValid, selectedBlock, forkBlock]);

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

  // 检查是否可以进行分叉
  const canFork = () => {
    return !isForkingInProgress && 
           currentWallet && 
           chain.length >= 3 && 
           forkBlock && 
           forkBlock.index < chain.length - 1;
  };

  // 模拟区块链分叉和触发最长链原则
  const simulateFork = async () => {
    if (!currentWallet || chain.length < 3 || !forkBlock || isForkingInProgress) {
      alert('请先选择一个钱包和分叉点，或等待当前操作完成');
      return;
    }
    
    // 确保分叉点不是最后一个区块
    if (forkBlock.index >= chain.length - 1) {
      alert('分叉点必须至少在倒数第二个区块之前，才能看到明显的分叉效果');
      return;
    }

    setIsForkingInProgress(true);
    
    try {
      // 步骤1: 创建分叉链（从选定的分叉点开始）
      setForkProgress('1/4 - 创建分叉链...');
      
      // 找到选定的分叉点在链中的索引
      const forkIndex = chain.findIndex(block => block.hash === forkBlock.hash);
      if (forkIndex === -1) {
        throw new Error('找不到选定的分叉点');
      }
      
      // 从分叉点创建新链
      const forkChain = JSON.parse(JSON.stringify(chain.slice(0, forkIndex + 1)));
      
      // 步骤2: 计算需要创建的新区块数量，使分叉链比原链长
      setForkProgress('2/4 - 准备在分叉上挖矿...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 仿真延迟
      
      // 需要创建的区块数，至少要比原链多一个区块
      const blocksNeeded = chain.length - forkIndex;
      
      // 在分叉上添加足够多的区块，使其比原链更长
      setForkProgress('3/4 - 在分叉上创建新区块...');
      
      // 记录所有被替换的区块哈希值，用于后面显示
      const replacedBlocks = chain.slice(forkIndex + 1).map(block => block.hash);
      
      // 添加足够多的区块
      for (let i = 0; i < blocksNeeded; i++) {
        const lastBlock = forkChain[forkChain.length - 1];
        
        // 创建交易（自己转给自己，简单起见）
        const transaction: Transaction = {
          id: `fork-tx-${Date.now()}-${i}`,
          from: currentWallet.address,
          to: currentWallet.address,
          amount: 1,
          timestamp: Date.now()
        };
        
        // 创建新区块
        const newBlockData = {
          index: lastBlock.index + 1,
          timestamp: Date.now(),
          transactions: [
            transaction,
            {
              id: `reward-fork-${Date.now()}-${i}`,
              from: '系统',
              to: currentWallet.address,
              amount: 100,
              timestamp: Date.now()
            }
          ],
          previousHash: lastBlock.hash,
          nonce: 0,
          difficulty: lastBlock.difficulty
        };
        
        // 手动计算满足难度的哈希
        let hash = '';
        let nonce = 0;
        const targetPrefix = Array(newBlockData.difficulty + 1).join('0');
        
        while(true) {
          newBlockData.nonce = nonce;
          hash = calculateBlockHash(newBlockData);
          if (hash.startsWith(targetPrefix)) break;
          nonce++;
          if (nonce > 500) break; // 限制循环次数，避免界面卡死
        }
        
        const newBlock = {
          ...newBlockData,
          hash
        };
        
        forkChain.push(newBlock);
        await new Promise(resolve => setTimeout(resolve, 200)); // 添加一点延迟
      }
      
      // 步骤3: 将分叉链添加到已知链中
      setForkProgress('4/4 - 触发最长链原则...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 仿真延迟
      
      // 将分叉链添加到区块链中，触发最长链选择
      blockchain.addKnownChain(forkChain);
      
      // 刷新界面显示
      refreshBalances();
      const newChain = blockchain.getChain();
      setChain(newChain);
      setChainValid(isChainValid());
      
      // 计算实际被替换的区块数量
      const actualReplaced = replacedBlocks.filter(hash => 
        !newChain.some(block => block.hash === hash)
      ).length;
      
      alert(`成功模拟了区块链分叉并触发了最长链原则！\n` + 
            `从区块 #${forkBlock.index} 创建的分叉成为了新的主链。\n` + 
            `${actualReplaced} 个区块被替换了。\n` +
            `查看区块链列表，您会发现区块已经变化。`);
      
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
        
        {/* 分叉选择区域 */}
        <div className="mt-3 p-3 border rounded bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">区块链分叉模拟</h3>
            <button 
              onClick={() => setShowForkHelp(!showForkHelp)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              {showForkHelp ? '隐藏帮助' : '显示帮助'}
            </button>
          </div>
          
          {showForkHelp && (
            <div className="mt-2 mb-3 p-2 bg-gray-50 text-sm rounded">
              <p>如何模拟区块链分叉:</p>
              <ol className="list-decimal list-inside ml-2 mt-1">
                <li>选择一个要从其分叉的区块（点击区块列表中的区块并点击"设为分叉点"按钮）</li>
                <li>分叉点应该是早期区块，以便能看到明显的分叉效果</li>
                <li>点击"模拟区块链分叉"按钮</li>
                <li>系统会从选择的区块创建一个新的分叉链，并使其比原链更长</li>
                <li>通过最长链原则，系统会自动接受新的分叉链</li>
              </ol>
            </div>
          )}
          
          <div className="mt-2">
            {forkBlock ? (
              <div className="mb-3 p-2 border rounded bg-purple-50">
                <p className="font-semibold">已选分叉点: 区块 #{forkBlock.index}</p>
                <p className="text-xs">哈希: {formatHash(forkBlock.hash)}</p>
                <p className="text-xs text-gray-600">
                  选择此区块后的分叉将替换从区块 #{forkBlock.index + 1} 开始的 {chain.length - forkBlock.index - 1} 个区块
                </p>
              </div>
            ) : (
              <p className="mb-3 text-orange-500">请先选择一个分叉点（点击区块后使用"设为分叉点"按钮）</p>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={simulateFork}
                disabled={!canFork()}
                className={`px-4 py-2 rounded ${
                  canFork()
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-400 cursor-not-allowed text-white'
                }`}
              >
                {isForkingInProgress ? `模拟分叉中... ${forkProgress}` : '模拟区块链分叉'}
              </button>
              
              {selectedBlock && (
                <button
                  onClick={() => setForkBlock(selectedBlock)}
                  disabled={selectedBlock.index >= chain.length - 1}
                  className={`px-4 py-2 rounded ${
                    selectedBlock.index >= chain.length - 1
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  设为分叉点
                </button>
              )}
            </div>
            
            <p className="text-xs mt-1 text-gray-600">
              (分叉需要：已选择钱包 + 至少3个区块 + 选择了分叉点 + 分叉点不是最后一个区块)
            </p>
          </div>
        </div>
      </div>
      
      {/* 区块列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {chain.map((block, index) => (
          <div
            key={block.hash}
            className={`p-3 border rounded cursor-pointer ${
              selectedBlock?.hash === block.hash 
                ? 'bg-blue-100 border-blue-300' 
                : forkBlock?.hash === block.hash
                  ? 'bg-purple-100 border-purple-300'
                  : 'hover:bg-gray-100'
            }`}
            onClick={() => setSelectedBlock(block)}
          >
            <p className="font-semibold">区块 #{block.index}
              {forkBlock?.hash === block.hash && <span className="ml-2 text-purple-600 text-sm">(分叉点)</span>}
            </p>
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