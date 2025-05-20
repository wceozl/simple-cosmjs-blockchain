import { 
  Block, 
  Transaction, 
  createGenesisBlock, 
  calculateBlockHash, 
  isBlockValid 
} from './models';

// 区块链类
export class Blockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private difficulty: number;
  private miningReward: number;
  private knownChains: Block[][];  // 用于存储其他已知的链（实现最长链原则）

  constructor() {
    // 初始化区块链
    this.chain = [createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 2;
    this.miningReward = 100;
    this.knownChains = [];
  }

  // 获取最新区块
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // 获取整个区块链
  public getChain(): Block[] {
    return [...this.chain];
  }

  // 获取待处理交易
  public getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  // 获取区块链难度
  public getDifficulty(): number {
    return this.difficulty;
  }

  // 获取挖矿奖励
  public getMiningReward(): number {
    return this.miningReward;
  }

  // 添加待处理交易
  public addTransaction(transaction: Transaction): boolean {
    // 这里可以添加更多的交易验证逻辑
    if (!transaction.from || !transaction.to || transaction.amount <= 0) {
      return false;
    }

    // 验证发送方余额是否足够
    const senderBalance = this.getBalanceOfAddress(transaction.from);
    if (senderBalance < transaction.amount) {
      console.log('交易失败: 余额不足');
      return false;
    }

    this.pendingTransactions.push(transaction);
    return true;
  }

  // 开始挖矿处理待处理交易
  public minePendingTransactions(minerAddress: string): Block | null {
    // 创建一个包含矿工奖励的交易
    const rewardTransaction: Transaction = {
      id: 'reward-' + Date.now(),
      from: '系统',
      to: minerAddress,
      amount: this.miningReward,
      timestamp: Date.now()
    };

    // 添加奖励交易到待处理交易列表中
    this.pendingTransactions.push(rewardTransaction);

    // 创建新区块
    const previousBlock = this.getLatestBlock();
    const newBlock: Omit<Block, 'hash'> = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: previousBlock.hash,
      nonce: 0,
      difficulty: this.difficulty
    };

    // 挖矿（工作量证明）
    const minedBlock = this.proofOfWork(newBlock);
    
    if (!minedBlock) {
      return null;
    }

    // 添加新区块到链中
    if (this.addBlock(minedBlock)) {
      // 清空待处理交易并准备下一轮
      this.pendingTransactions = [];
      return minedBlock;
    }
    
    return null;
  }

  // 执行工作量证明算法来挖矿
  private proofOfWork(block: Omit<Block, 'hash'>): Block | null {
    const maxAttempts = 5000000; // 设置最大尝试次数防止无限循环
    let attempts = 0;
    
    console.log('开始挖矿...');
    const targetPrefix = Array(block.difficulty + 1).join('0');
    
    while (attempts < maxAttempts) {
      const hash = calculateBlockHash(block);
      
      if (hash.startsWith(targetPrefix)) {
        console.log(`成功挖掘区块! 哈希值: ${hash}, 尝试次数: ${attempts}`);
        return {
          ...block,
          hash
        };
      }
      
      block.nonce++;
      attempts++;
      
      // 每10000次尝试输出一次进度
      if (attempts % 10000 === 0) {
        console.log(`尝试次数: ${attempts}, 当前nonce: ${block.nonce}`);
      }
    }
    
    console.log('挖矿失败: 已达到最大尝试次数');
    return null;
  }

  // 添加区块到链中
  public addBlock(newBlock: Block): boolean {
    const latestBlock = this.getLatestBlock();
    
    // 验证新区块是否有效
    if (!isBlockValid(newBlock, latestBlock)) {
      console.log('区块无效，拒绝添加');
      return false;
    }
    
    this.chain.push(newBlock);
    
    // 根据最长链原则，确保当前链是最长的
    this.resolveConflicts();
    
    // 根据区块数量自动调整难度
    this.adjustDifficulty();
    
    return true;
  }

  // 根据链长自动调整难度
  private adjustDifficulty(): void {
    // 每生成10个区块后调整一次难度
    if (this.chain.length % 10 === 0) {
      // 这里简单实现：如果前10个区块的平均生成时间小于30秒，则增加难度
      const lastTenBlocks = this.chain.slice(-10);
      const averageTime = (lastTenBlocks[9].timestamp - lastTenBlocks[0].timestamp) / 9;
      
      if (averageTime < 30000) { // 小于30秒
        this.difficulty += 1;
        console.log(`难度增加到: ${this.difficulty}`);
      } else if (averageTime > 60000 && this.difficulty > 1) { // 大于60秒且当前难度大于1
        this.difficulty -= 1;
        console.log(`难度降低到: ${this.difficulty}`);
      }
    }
  }

  // 验证整个区块链是否有效
  public isChainValid(): boolean {
    // 从第二个区块开始验证（跳过创世区块）
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // 验证当前区块的哈希值是否正确
      if (currentBlock.hash !== calculateBlockHash({
        index: currentBlock.index,
        previousHash: currentBlock.previousHash,
        timestamp: currentBlock.timestamp,
        transactions: currentBlock.transactions,
        nonce: currentBlock.nonce,
        difficulty: currentBlock.difficulty
      })) {
        return false;
      }
      
      // 验证与前一个区块的连接是否正确
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  }

  // 获取地址的余额（通过查询所有交易）
  public getBalanceOfAddress(address: string): number {
    let balance = 0;
    
    // 遍历所有区块中的所有交易
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // 如果地址是发送方，减少余额
        if (transaction.from === address) {
          balance -= transaction.amount;
        }
        
        // 如果地址是接收方，增加余额
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }
    
    return balance;
  }

  // 添加已知的另一条链
  public addKnownChain(chain: Block[]): void {
    if (chain.length > 0 && this.isValidChain(chain)) {
      this.knownChains.push([...chain]);
      this.resolveConflicts();
    }
  }

  // 验证提供的链是否有效
  private isValidChain(chain: Block[]): boolean {
    // 创世区块必须相同
    if (JSON.stringify(chain[0]) !== JSON.stringify(this.chain[0])) {
      return false;
    }
    
    // 验证链中的每个区块
    for (let i = 1; i < chain.length; i++) {
      if (!isBlockValid(chain[i], chain[i - 1])) {
        return false;
      }
    }
    
    return true;
  }

  // 实现最长链原则，解决冲突
  private resolveConflicts(): void {
    // 把当前链也加入比较
    const allChains = [this.chain, ...this.knownChains];
    let maxLength = this.chain.length;
    let longestChain = this.chain;
    
    // 查找最长的有效链
    for (const chain of allChains) {
      if (chain.length > maxLength && this.isValidChain(chain)) {
        maxLength = chain.length;
        longestChain = chain;
      }
    }
    
    // 如果找到更长的链，替换当前链
    if (longestChain !== this.chain) {
      console.log('发现更长的链，替换当前链');
      this.chain = [...longestChain];
      
      // 更新待处理交易（排除已经在新链中的交易）
      this.updatePendingTransactions();
    }
  }

  // 更新待处理交易，排除已经在链中的交易
  private updatePendingTransactions(): void {
    const txInChain = new Set<string>();
    
    // 收集所有已在链中的交易ID
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        txInChain.add(tx.id);
      }
    }
    
    // 过滤待处理交易
    this.pendingTransactions = this.pendingTransactions.filter(tx => !txInChain.has(tx.id));
  }
}