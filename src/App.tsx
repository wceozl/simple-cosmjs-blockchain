import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">简易区块链应用</h1>
      </header>
      <main className="container mx-auto p-4">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-4">区块链学习项目</h2>
          <p>欢迎使用这个简单的区块链应用，我们将会实现：</p>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>区块生成与挖矿</li>
            <li>交易和转账功能</li>
            <li>最长链原则</li>
            <li>区块浏览器</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;