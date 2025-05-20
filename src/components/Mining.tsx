import React from 'react';
import { useBlockchain } from '../blockchain';

const Mining: React.FC = () => {
  const { 
    blockchain,
    currentWallet, 
    isMining, 
    miningProgress, 
    startMining 
  } = useBlockchain();
  
  const pendingTransactions = blockchain.getPendingTransactions();
  const miningReward = blockchain.getMiningReward();
  const difficulty = blockchain.getDifficulty();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">挖矿</h2>
      
      {/* 当前挖矿信息 */}
      <div className="mb-4">
        <p className="mb-2">
          <span className="font-semibold">当前难度:</span> {difficulty}
        </p>
        <p className="mb-2">
          <span className="font-semibold">挖矿奖励:</span> {miningReward} 个币
        </p>
        <p className="mb-2">
          <span className="font-semibold">待处理交易:</span> {pendingTransactions.length} 笔
        </p>
      </div>
      
      {/* 待处理交易列表 */}
      {pendingTransactions.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">待处理交易列表:</h3>
          
          <div className="max-h-40 overflow-y-auto">
            {pendingTransactions.map((tx, index) => (
              <div key={index} className="p-2 mb-2 border rounded text-sm">
                <p className="text-xs">ID: {tx.id}</p>
                <p className="text-xs truncate">从: {tx.from}</p>
                <p className="text-xs truncate">到: {tx.to}</p>
                <p>金额: {tx.amount} 个币</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 挖矿进度 */}
      {isMining && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">挖矿进行中...</h3>
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${miningProgress}%` }}
            ></div>
          </div>
          
          <p className="text-center mt-1">{Math.round(miningProgress)}%</p>
        </div>
      )}
      
      {/* 挖矿按钮 */}
      <button
        onClick={startMining}
        disabled={isMining || !currentWallet}
        className={`w-full px-4 py-2 ${
          isMining || !currentWallet
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-yellow-500 hover:bg-yellow-600'
        } text-white rounded`}
      >
        {isMining 
          ? '挖矿中...' 
          : !currentWallet 
            ? '请先选择钱包' 
            : '开始挖矿'}
      </button>
      
      <div className="mt-4 p-3 border rounded bg-yellow-50 text-sm">
        <p className="font-semibold">挖矿说明:</p>
        <ul className="list-disc list-inside mt-1">
          <li>挖矿是通过工作量证明(Proof of Work)机制验证交易</li>
          <li>挖矿成功后会得到 {miningReward} 个币作为奖励</li>
          <li>难度越高，挖矿所需时间越长</li>
          <li>当前挖矿难度为 {difficulty}，需要计算出以 {Array(difficulty + 1).join('0')} 开头的哈希</li>
        </ul>
      </div>
    </div>
  );
};

export default Mining;