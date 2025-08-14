export interface Order {
  id: string;
  price: number;
  size: number;
  total: number;
  timestamp: number;
}

export interface OrderBook {
  bids: Order[];
  asks: Order[];
  lastUpdate: number;
  sequence: number;
}

export interface MarketData {
  spread: {
    absolute: number;
    percentage: number;
  };
  lastTrade: {
    price: number;
    size: number;
    side: 'buy' | 'sell';
    time: number;
  };
  volume: {
    bidTotal: number;
    askTotal: number;
    ratio: number;
  };
}

export interface OrderBookConfig {
  basePrice?: number;
  priceStep?: number;
  maxSize?: number;
  volatility?: number;
  updateInterval?: number;
  maxRows?: number;
}

export interface Update {
  type: 'update' | 'add' | 'cancel' | 'trade';
  side?: 'bid' | 'ask' | 'buy' | 'sell';
  orderId?: string;
  newSize?: number;
  price?: number;
  size?: number;
}

export type SubscriberCallback = (event: string, data: any) => void;

// Order Book Engine Class
export class OrderBookEngine {
  private config: Required<OrderBookConfig>;
  private orderbook: OrderBook;
  private marketData: MarketData;
  private subscribers: Set<SubscriberCallback>;
  private isRunning: boolean;
  private intervalId: NodeJS.Timeout | null;

  constructor(config: OrderBookConfig = {}) {
    this.config = {
      basePrice: 50000,
      priceStep: 0.01,
      maxSize: 1000,
      volatility: 0.001,
      updateInterval: 100,
      maxRows: 20,
      ...config
    };

    this.orderbook = {
      bids: [],
      asks: [],
      lastUpdate: Date.now(),
      sequence: 0
    };

    this.marketData = {
      spread: { absolute: 0, percentage: 0 },
      lastTrade: { price: 0, size: 0, side: 'buy', time: Date.now() },
      volume: { bidTotal: 0, askTotal: 0, ratio: 0 }
    };

    this.subscribers = new Set();
    this.isRunning = false;
    this.intervalId = null;

    this.initialize();
  }

  private initialize(): void {
    const { basePrice, priceStep, maxRows } = this.config;
    const bids: Order[] = [];
    const asks: Order[] = [];
    
    // Generate bids (below current price)
    for (let i = 0; i < maxRows; i++) {
      const price = basePrice - (i + 1) * priceStep;
      const size = this.generateRandomSize();
      bids.push({ 
        id: this.generateOrderId(),
        price, 
        size, 
        total: 0,
        timestamp: Date.now() - Math.random() * 60000
      });
    }
    
    // Generate asks (above current price)
    for (let i = 0; i < maxRows; i++) {
      const price = basePrice + (i + 1) * priceStep;
      const size = this.generateRandomSize();
      asks.push({ 
        id: this.generateOrderId(),
        price, 
        size, 
        total: 0,
        timestamp: Date.now() - Math.random() * 60000
      });
    }
    
    this.orderbook.bids = bids;
    this.orderbook.asks = asks;
    this.recalculateTotals();
    this.updateMarketData();
    this.orderbook.lastUpdate = Date.now();
    this.orderbook.sequence++;
  }

  private generateRandomSize(base?: number): number {
    const { maxSize } = this.config;
    if (base) {
      const variance = base * 0.3;
      return Math.max(1, base + (Math.random() - 0.5) * variance);
    }
    
    const rand = Math.random();
    if (rand < 0.4) {
      return Math.random() * 50 + 1;
    } else if (rand < 0.8) {
      return Math.random() * 150 + 50;
    } else {
      return Math.random() * (maxSize - 200) + 200;
    }
  }

  private generateOrderId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private recalculateTotals(): void {
    let bidTotal = 0;
    this.orderbook.bids.forEach(bid => {
      bidTotal += bid.size;
      bid.total = bidTotal;
    });
    
    let askTotal = 0;
    this.orderbook.asks.forEach(ask => {
      askTotal += ask.size;
      ask.total = askTotal;
    });
  }

  private updateMarketData(): void {
    const { bids, asks } = this.orderbook;
    
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
      
      this.marketData.spread = {
        absolute: bestAsk - bestBid,
        percentage: ((bestAsk - bestBid) / bestBid) * 100
      };

      const bidTotal = bids[bids.length - 1]?.total || 0;
      const askTotal = asks[asks.length - 1]?.total || 0;
      
      this.marketData.volume = {
        bidTotal,
        askTotal,
        ratio: askTotal > 0 ? bidTotal / askTotal : 0
      };
    }
  }

  public addOrder(side: 'bid' | 'ask', price: number, size: number): void {
    const order: Order = {
      id: this.generateOrderId(),
      price,
      size,
      total: 0,
      timestamp: Date.now()
    };

    if (side === 'bid') {
      const insertIndex = this.orderbook.bids.findIndex(bid => bid.price < price);
      if (insertIndex === -1) {
        this.orderbook.bids.push(order);
      } else {
        this.orderbook.bids.splice(insertIndex, 0, order);
      }
      
      if (this.orderbook.bids.length > this.config.maxRows) {
        this.orderbook.bids = this.orderbook.bids.slice(0, this.config.maxRows);
      }
    } else {
      const insertIndex = this.orderbook.asks.findIndex(ask => ask.price > price);
      if (insertIndex === -1) {
        this.orderbook.asks.push(order);
      } else {
        this.orderbook.asks.splice(insertIndex, 0, order);
      }
      
      if (this.orderbook.asks.length > this.config.maxRows) {
        this.orderbook.asks = this.orderbook.asks.slice(0, this.config.maxRows);
      }
    }

    this.recalculateTotals();
    this.updateMarketData();
    this.notifySubscribers('orderAdded', { side, order });
  }

  public updateOrder(orderId: string, newSize: number): boolean {
    let found = false;
    let side: 'bid' | 'ask' | null = null;

    const bidIndex = this.orderbook.bids.findIndex(bid => bid.id === orderId);
    if (bidIndex !== -1) {
      this.orderbook.bids[bidIndex].size = newSize;
      if (newSize === 0) {
        this.orderbook.bids.splice(bidIndex, 1);
      }
      found = true;
      side = 'bid';
    }

    if (!found) {
      const askIndex = this.orderbook.asks.findIndex(ask => ask.id === orderId);
      if (askIndex !== -1) {
        this.orderbook.asks[askIndex].size = newSize;
        if (newSize === 0) {
          this.orderbook.asks.splice(askIndex, 1);
        }
        found = true;
        side = 'ask';
      }
    }

    if (found) {
      this.recalculateTotals();
      this.updateMarketData();
      this.notifySubscribers('orderUpdated', { orderId, newSize, side });
    }

    return found;
  }

  public removeOrder(orderId: string): boolean {
    return this.updateOrder(orderId, 0);
  }

  public executeTrade(price: number, size: number, side: 'buy' | 'sell'): void {
    this.marketData.lastTrade = {
      price,
      size,
      side,
      time: Date.now()
    };

    if (side === 'buy') {
      let remainingSize = size;
      this.orderbook.asks = this.orderbook.asks.filter(ask => {
        if (remainingSize <= 0 || ask.price > price) return true;
        
        if (ask.size <= remainingSize) {
          remainingSize -= ask.size;
          return false;
        } else {
          ask.size -= remainingSize;
          remainingSize = 0;
          return true;
        }
      });
    } else {
      let remainingSize = size;
      this.orderbook.bids = this.orderbook.bids.filter(bid => {
        if (remainingSize <= 0 || bid.price < price) return true;
        
        if (bid.size <= remainingSize) {
          remainingSize -= bid.size;
          return false;
        } else {
          bid.size -= remainingSize;
          remainingSize = 0;
          return true;
        }
      });
    }

    this.recalculateTotals();
    this.updateMarketData();
    this.notifySubscribers('trade', { price, size, side });
  }

  private ensureMinimumOrders(): void {
    const minOrders = Math.floor(this.config.maxRows * 0.7);
    
    while (this.orderbook.bids.length < minOrders) {
      const lastBidPrice = this.orderbook.bids.length > 0 
        ? this.orderbook.bids[this.orderbook.bids.length - 1].price
        : this.config.basePrice - this.config.priceStep;
      
      const newPrice = lastBidPrice - this.config.priceStep;
      const newSize = this.generateRandomSize();
      
      this.orderbook.bids.push({
        id: this.generateOrderId(),
        price: newPrice,
        size: newSize,
        total: 0,
        timestamp: Date.now()
      });
    }
    
    while (this.orderbook.asks.length < minOrders) {
      const lastAskPrice = this.orderbook.asks.length > 0 
        ? this.orderbook.asks[this.orderbook.asks.length - 1].price
        : this.config.basePrice + this.config.priceStep;
      
      const newPrice = lastAskPrice + this.config.priceStep;
      const newSize = this.generateRandomSize();
      
      this.orderbook.asks.push({
        id: this.generateOrderId(),
        price: newPrice,
        size: newSize,
        total: 0,
        timestamp: Date.now()
      });
    }
    
    this.orderbook.bids.sort((a, b) => b.price - a.price);
    this.orderbook.asks.sort((a, b) => a.price - b.price);
  }

  private simulateMarketUpdate(): Update[] {
    const updates: Update[] = [];
    const numUpdates = Math.floor(Math.random() * 3) + 1;
    
    this.ensureMinimumOrders();
    
    for (let i = 0; i < numUpdates; i++) {
      const updateType = Math.random();
      
      if (updateType < 0.5) {
        this.simulateOrderUpdate(updates);
      } else if (updateType < 0.8) {
        this.simulateNewOrder(updates);
      } else if (updateType < 0.95) {
        this.simulateCancellation(updates);
      } else {
        this.simulateTrade(updates);
      }
    }

    this.orderbook.lastUpdate = Date.now();
    this.orderbook.sequence++;
    
    return updates;
  }

  private simulateOrderUpdate(updates: Update[]): void {
    const side: 'bids' | 'asks' = Math.random() > 0.5 ? 'bids' : 'asks';
    const orders = this.orderbook[side];
    
    if (orders.length > 0) {
      const orderIndex = Math.floor(Math.random() * Math.min(orders.length, Math.floor(orders.length * 0.8)));
      const order = orders[orderIndex];
      
      if (order) {
        const change = (Math.random() - 0.5) * this.config.maxSize * 0.1;
        const newSize = Math.max(order.size * 0.3, order.size + change);
        
        this.updateOrder(order.id, newSize);
        updates.push({ type: 'update', side: side.slice(0, -1) as 'bid' | 'ask', orderId: order.id, newSize });
      }
    }
  }

  private simulateNewOrder(updates: Update[]): void {
    const side: 'bid' | 'ask' = Math.random() > 0.5 ? 'bid' : 'ask';
    const { bids, asks } = this.orderbook;
    
    if (side === 'bid' && bids.length > 0) {
      const bestBid = bids[0].price;
      const newPrice = bestBid + this.config.priceStep;
      
      if (asks.length === 0 || newPrice < asks[0].price) {
        const newSize = this.generateRandomSize() * 0.5 + 10;
        this.addOrder('bid', newPrice, newSize);
        updates.push({ type: 'add', side: 'bid', price: newPrice, size: newSize });
      }
    } else if (side === 'ask' && asks.length > 0) {
      const bestAsk = asks[0].price;
      const newPrice = bestAsk - this.config.priceStep;
      
      if (bids.length === 0 || newPrice > bids[0].price) {
        const newSize = this.generateRandomSize() * 0.5 + 10;
        this.addOrder('ask', newPrice, newSize);
        updates.push({ type: 'add', side: 'ask', price: newPrice, size: newSize });
      }
    }
  }

  private simulateCancellation(updates: Update[]): void {
    const side: 'bids' | 'asks' = Math.random() > 0.5 ? 'bids' : 'asks';
    const orders = this.orderbook[side];
    
    const minOrders = Math.floor(this.config.maxRows * 0.7);
    if (orders.length > minOrders) {
      const orderIndex = Math.floor(Math.random() * Math.min(orders.length - minOrders, 5)) + minOrders;
      const order = orders[orderIndex];
      
      if (order) {
        this.removeOrder(order.id);
        updates.push({ type: 'cancel', side: side.slice(0, -1) as 'bid' | 'ask', orderId: order.id });
      }
    }
  }

  private simulateTrade(updates: Update[]): void {
    const { bids, asks } = this.orderbook;
    
    if (bids.length > 0 && asks.length > 0) {
      const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
      const price = side === 'buy' ? asks[0].price : bids[0].price;
      const maxAvailable = side === 'buy' ? asks[0].size : bids[0].size;
      
      const size = Math.min(maxAvailable * 0.5, Math.random() * 20 + 1);
      
      this.executeTrade(price, size, side);
      updates.push({ type: 'trade', price, size, side });
    }
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      const updates = this.simulateMarketUpdate();
      this.notifySubscribers('update', { updates, orderbook: this.getOrderbook() });
    }, this.config.updateInterval);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in orderbook subscriber:', error);
      }
    });
  }

  public getOrderbook(): OrderBook {
    return {
      bids: [...this.orderbook.bids],
      asks: [...this.orderbook.asks],
      lastUpdate: this.orderbook.lastUpdate,
      sequence: this.orderbook.sequence
    };
  }

  public getMarketData(): MarketData {
    return { ...this.marketData };
  }

  public updateConfig(newConfig: Partial<OrderBookConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isRunning && newConfig.updateInterval) {
      this.stop();
      this.start();
    }
  }

  public reset(): void {
    this.stop();
    this.initialize();
    this.notifySubscribers('reset', { orderbook: this.getOrderbook() });
  }

  public getBestPrices(): { bestBid: number | null; bestAsk: number | null } {
    const { bids, asks } = this.orderbook;
    return {
      bestBid: bids.length > 0 ? bids[0].price : null,
      bestAsk: asks.length > 0 ? asks[0].price : null
    };
  }
}