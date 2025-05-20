import React, { useState } from 'react';
import { useBlockchain } from '../blockchain';

const Wallet: React.FC = () => {
  const { 
    currentWallet, 
    wallets, 
    createWallet, 
    selectWallet, 
    createTransaction 
  } = useBlockchain();
  
  const [toAddress, setToAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  // 处理创建交易
  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toAddress || amount <= 0) {
      alert('请输入有效的收款地址和金额');
      return;
    }
    
    const success = createTransaction(toAddress, amount);
    
    if (success) {
      alert('交易已创建并添加到待处理交易池');
      // 清空表单
      setToAddress('');
      setAmount(0);
    } else {
      alert('交易创建失败，请检查您的余额或交易参数');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">钱包</h2>
      
      {/* 当前钱包信息 */}
      {currentWallet ? (
        <div className="mb-4 p-3 border rounded bg-blue-50">
          <p className="font-semibold">当前钱包:</p>
          <p className="text-sm break-all">{currentWallet.address}</p>
          <p className="mt-2">余额: <span className="font-bold">{currentWallet.balance}</span> 个币</p>
        </div>
      ) : (
        <div className="mb-4 p-3 border rounded bg-yellow-50">
          <p>未选择钱包</p>
        </div>
      )}
      
      {/* 钱包列表 */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">我的钱包列表:</h3>
        
        {wallets.length === 0 ? (
          <p>没有钱包，请创建一个新钱包</p>
        ) : (
          <div className="max-h-40 overflow-y-auto">
            {wallets.map((wallet, index) => (
              <div 
                key={index}
                className={`p-2 mb-2 border rounded cursor-pointer ${
                  currentWallet?.address === wallet.address 
                    ? 'bg-blue-100 border-blue-300' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => selectWallet(wallet.address)}
              >
                <p className="text-xs break-all">{wallet.address}</p>
                <p className="text-sm">余额: {wallet.balance} 个币</p>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={createWallet}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          创建新钱包
        </button>
      </div>
      
      {/* 发送交易表单 */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">发送交易:</h3>
        
        <form onSubmit={handleTransaction}>
          <div className="mb-3">
            <label className="block text-sm mb-1">收款地址:</label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="输入接收方地址"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm mb-1">金额:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border rounded"
              placeholder="输入金额"
              min="1"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!currentWallet}
            className={`w-full px-4 py-2 ${
              currentWallet 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-300 cursor-not-allowed'
            } text-white rounded`}
          >
            发送交易
          </button>
        </form>
      </div>
    </div>
  );
};

export default Wallet;