import { sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';

// 定义交易接口
export interface Transaction {
  id: string;         // 交易ID
  from: string;       // 发送方地址
  to: string;         // 接收方地址
  amount: number;     // 交易金额
  timestamp: number;  // 交易时间戳
  signature?: string; // 交易签名（可选）
}

// 定义区块接口
export interface Block {
  index: number;         // 区块索引（高度）
  timestamp: number;     // 区块生成时间戳
  transactions: Transaction[]; // 包含的交易列表
  previousHash: string;  // 前一个区块的哈希值
  hash: string;          // 当前区块的哈希值
  nonce: number;         // 用于挖矿的随机数
  difficulty: number;    // 挖矿难度
}

// 创建一个交易
export const createTransaction = (
  from: string,
  to: string,
  amount: number,
): Transaction => {
  const transaction: Transaction = {
    id: generateId(),
    from,
    to,
    amount,
    timestamp: Date.now(),
  };
  
  return transaction;
};

// 生成一个简单的随机ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// 计算区块的哈希值
export const calculateBlockHash = (block: Omit<Block, 'hash'>): string => {
  const blockString = JSON.stringify({
    index: block.index,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    transactions: block.transactions,
    nonce: block.nonce,
    difficulty: block.difficulty
  });
  
  // 使用SHA-256算法生成哈希
  return toHex(sha256(new TextEncoder().encode(blockString)));
};

// 创建创世区块（第一个区块）
export const createGenesisBlock = (): Block => {
  const genesisBlock: Omit<Block, 'hash'> = {
    index: 0,
    timestamp: Date.now(),
    transactions: [],
    previousHash: '0', // 创世区块没有前置区块，使用0表示
    nonce: 0,
    difficulty: 2 // 初始挖矿难度
  };
  
  // 计算并添加哈希值
  const hash = calculateBlockHash(genesisBlock);
  
  return {
    ...genesisBlock,
    hash
  };
};

// 验证区块是否有效
export const isBlockValid = (newBlock: Block, previousBlock: Block): boolean => {
  // 检查索引是否连续
  if (previousBlock.index + 1 !== newBlock.index) {
    return false;
  }
  
  // 检查前一个区块的哈希是否正确
  if (previousBlock.hash !== newBlock.previousHash) {
    return false;
  }
  
  // 验证当前区块的哈希是否正确
  const calculatedHash = calculateBlockHash({
    index: newBlock.index,
    previousHash: newBlock.previousHash,
    timestamp: newBlock.timestamp,
    transactions: newBlock.transactions,
    nonce: newBlock.nonce,
    difficulty: newBlock.difficulty
  });
  
  if (calculatedHash !== newBlock.hash) {
    return false;
  }
  
  // 验证工作量证明（挖矿结果）
  const hashRequirement = Array(newBlock.difficulty + 1).join('0');
  if (!newBlock.hash.startsWith(hashRequirement)) {
    return false;
  }
  
  return true;
};