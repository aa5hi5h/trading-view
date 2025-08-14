"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Pause, Play, Settings } from 'lucide-react';

const OrderBookComponent = () => {
  // State management
  const [isRunning, setIsRunning] = useState(true);
  const [precision, setPrecision] = useState(2);
  const [maxRows, setMaxRows] = useState(20);
  const [spreadInfo, setSpreadInfo] = useState({ absolute: 0, percentage: 0 });
  const [lastTrade, setLastTrade] = useState({ price: 0, size: 0, side: 'buy', time: Date.now() });
  const [settings, setSettings] = useState({
    updateInterval: 100,
    priceStep: 0.01,
    maxSize: 1000,
    volatility: 0.001
  });

  // Orderbook data
  const [orderbook, setOrderbook] = useState({
    bids: [],
    asks: [],
    lastUpdate: Date.now()
  });

  // Animation and visual states
  const [flashingRows, setFlashingRows] = useState(new Set());
  const [hoveredRow, setHoveredRow] = useState(null);
  const intervalRef = useRef(null);
  const basePrice = useRef(50000); // Starting price

  // Generate initial orderbook data
  const generateInitialOrderbook = () => {
    const bids = [];
    const asks = [];
    const currentPrice = basePrice.current;
    
    // Generate bids (below current price)
    for (let i = 0; i < maxRows; i++) {
      const price = currentPrice - (i + 1) * settings.priceStep;
      const size = Math.random() * settings.maxSize + 10;
      bids.push({ price, size, total: 0 });
    }
    
    // Generate asks (above current price)
    for (let i = 0; i < maxRows; i++) {
      const price = currentPrice + (i + 1) * settings.priceStep;
      const size = Math.random() * settings.maxSize + 10;
      asks.push({ price, size, total: 0 });
    }
    
    // Calculate running totals
    let bidTotal = 0;
    bids.forEach(bid => {
      bidTotal += bid.size;
      bid.total = bidTotal;
    });
    
    let askTotal = 0;
    asks.forEach(ask => {
      askTotal += ask.size;
      ask.total = askTotal;
    });
    
    return { bids, asks, lastUpdate: Date.now() };
  };

  // Update orderbook with realistic changes
  const updateOrderbook = () => {
    setOrderbook(prevOrderbook => {
      const newOrderbook = {
        bids: [...prevOrderbook.bids],
        asks: [...prevOrderbook.asks],
        lastUpdate: Date.now()
      };
      
      const changedRows = new Set();
      
      // Update some random rows
      const numUpdates = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numUpdates; i++) {
        const updateBids = Math.random() > 0.5;
        const rows = updateBids ? newOrderbook.bids : newOrderbook.asks;
        const rowIndex = Math.floor(Math.random() * Math.min(rows.length, maxRows * 0.7));
        
        if (rows[rowIndex]) {
          // Sometimes remove orders (set size to 0), sometimes update
          if (Math.random() > 0.1) {
            const change = (Math.random() - 0.5) * settings.maxSize * 0.3;
            rows[rowIndex].size = Math.max(0, rows[rowIndex].size + change);
          } else {
            rows[rowIndex].size = 0;
          }
          
          changedRows.add(`${updateBids ? 'bid' : 'ask'}-${rowIndex}`);
        }
      }
      
      // Sometimes add new orders at better prices
      if (Math.random() > 0.8) {
        const addToBids = Math.random() > 0.5;
        if (addToBids && newOrderbook.bids.length > 0) {
          const bestBid = newOrderbook.bids[0].price;
          const newPrice = bestBid + settings.priceStep;
          if (newPrice < newOrderbook.asks[0]?.price) {
            newOrderbook.bids.unshift({
              price: newPrice,
              size: Math.random() * settings.maxSize * 0.5 + 10,
              total: 0
            });
            newOrderbook.bids = newOrderbook.bids.slice(0, maxRows);
            changedRows.add('bid-0');
          }
        } else if (newOrderbook.asks.length > 0) {
          const bestAsk = newOrderbook.asks[0].price;
          const newPrice = bestAsk - settings.priceStep;
          if (newPrice > newOrderbook.bids[0]?.price) {
            newOrderbook.asks.unshift({
              price: newPrice,
              size: Math.random() * settings.maxSize * 0.5 + 10,
              total: 0
            });
            newOrderbook.asks = newOrderbook.asks.slice(0, maxRows);
            changedRows.add('ask-0');
          }
        }
      }
      
      // Remove zero-size orders
      newOrderbook.bids = newOrderbook.bids.filter(bid => bid.size > 0);
      newOrderbook.asks = newOrderbook.asks.filter(ask => ask.size > 0);
      
      // Recalculate totals
      let bidTotal = 0;
      newOrderbook.bids.forEach(bid => {
        bidTotal += bid.size;
        bid.total = bidTotal;
      });
      
      let askTotal = 0;
      newOrderbook.asks.forEach(ask => {
        askTotal += ask.size;
        ask.total = askTotal;
      });
      
      // Flash changed rows
      if (changedRows.size > 0) {
        setFlashingRows(changedRows);
        setTimeout(() => setFlashingRows(new Set()), 200);
      }
      
      return newOrderbook;
    });
  };

  // Calculate spread
  useEffect(() => {
    if (orderbook.bids.length > 0 && orderbook.asks.length > 0) {
      const bestBid = orderbook.bids[0].price;
      const bestAsk = orderbook.asks[0].price;
      const absoluteSpread = bestAsk - bestBid;
      const percentageSpread = (absoluteSpread / bestBid) * 100;
      
      setSpreadInfo({
        absolute: absoluteSpread,
        percentage: percentageSpread
      });
      
      // Update last trade occasionally
      if (Math.random() > 0.95) {
        const tradePrice = Math.random() > 0.5 ? bestBid : bestAsk;
        const tradeSize = Math.random() * 50 + 1;
        const tradeSide = Math.random() > 0.5 ? 'buy' : 'sell';
        
        setLastTrade({
          price: tradePrice,
          size: tradeSize,
          side: tradeSide,
          time: Date.now()
        });
      }
    }
  }, [orderbook]);

  // Initialize orderbook
  useEffect(() => {
    setOrderbook(generateInitialOrderbook());
  }, [maxRows, settings]);

  // Auto-update orderbook
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(updateOrderbook, settings.updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, settings.updateInterval]);

  // Calculate max totals for visualization
  const maxBidTotal = useMemo(() => {
    return orderbook.bids.length > 0 ? Math.max(...orderbook.bids.map(b => b.total)) : 0;
  }, [orderbook.bids]);

  const maxAskTotal = useMemo(() => {
    return orderbook.asks.length > 0 ? Math.max(...orderbook.asks.map(a => a.total)) : 0;
  }, [orderbook.asks]);

  // Format price with precision
  const formatPrice = (price) => {
    return price.toFixed(precision);
  };

  // Format size
  const formatSize = (size) => {
    return size.toFixed(4);
  };

  // Get row background for depth visualization
  const getDepthBackground = (total, maxTotal, side) => {
    const intensity = (total / maxTotal) * 0.3;
    return side === 'bid' 
      ? `rgba(34, 197, 94, ${intensity})` 
      : `rgba(239, 68, 68, ${intensity})`;
  };

  const OrderRow = ({ order, index, side, maxTotal }) => {
    const isFlashing = flashingRows.has(`${side}-${index}`);
    const isHovered = hoveredRow === `${side}-${index}`;
    
    return (
      <div
        className={`grid grid-cols-3 gap-2 py-1 px-2 text-sm font-mono transition-all duration-200 cursor-pointer
          ${isFlashing ? (side === 'bid' ? 'bg-green-500/30' : 'bg-red-500/30') : ''}
          ${isHovered ? 'bg-gray-600/50' : ''}
          hover:bg-gray-600/30`}
        style={{
          background: isFlashing 
            ? undefined 
            : `linear-gradient(to ${side === 'bid' ? 'left' : 'right'}, ${getDepthBackground(order.total, maxTotal, side)}, transparent)`
        }}
        onMouseEnter={() => setHoveredRow(`${side}-${index}`)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <div className={`text-right ${side === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
          {formatPrice(order.price)}
        </div>
        <div className="text-right text-gray-300">
          {formatSize(order.size)}
        </div>
        <div className="text-right text-gray-500 text-xs">
          {formatSize(order.total)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Order Book</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2 rounded-lg transition-colors ${
                  isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
                title={isRunning ? 'Pause Updates' : 'Resume Updates'}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
              </button>
              
              <div className="flex items-center space-x-2 text-sm">
                <Activity size={16} className="text-blue-400" />
                <span className="text-gray-300">
                  {isRunning ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Spread Info */}
            <div className="text-sm">
              <span className="text-gray-400">Spread: </span>
              <span className="text-yellow-400 font-mono">
                {formatPrice(spreadInfo.absolute)} ({spreadInfo.percentage.toFixed(3)}%)
              </span>
            </div>
            
            {/* Last Trade */}
            <div className="text-sm">
              <span className="text-gray-400">Last: </span>
              <span className={`font-mono ${lastTrade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {formatPrice(lastTrade.price)}
              </span>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">
                Precision:
                <select
                  value={precision}
                  onChange={(e) => setPrecision(Number(e.target.value))}
                  className="ml-2 bg-gray-700 text-white rounded px-2 py-1"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
              
              <label className="text-sm text-gray-400">
                Rows:
                <select
                  value={maxRows}
                  onChange={(e) => setMaxRows(Number(e.target.value))}
                  className="ml-2 bg-gray-700 text-white rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 flex">
        {/* Main Order Book */}
        <div className="flex-1 flex flex-col">
          {/* Column Headers */}
          <div className="bg-gray-800 border-b border-gray-700 p-2">
            <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-400">
              <div className="text-right">Price</div>
              <div className="text-right">Size</div>
              <div className="text-right">Total</div>
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Asks (Sell Orders) */}
            <div className="flex-1 border-r border-gray-700">
              <div className="bg-gray-800 p-2 border-b border-gray-700">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp size={16} className="text-red-400" />
                  <span className="text-sm font-medium text-red-400">Asks</span>
                </div>
              </div>
              
              <div className="h-full overflow-hidden">
                <div className="flex flex-col-reverse h-full overflow-y-auto">
                  {orderbook.asks.slice(0, maxRows).reverse().map((ask, index) => (
                    <OrderRow
                      key={`ask-${orderbook.asks.length - 1 - index}`}
                      order={ask}
                      index={orderbook.asks.length - 1 - index}
                      side="ask"
                      maxTotal={maxAskTotal}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bids (Buy Orders) */}
            <div className="flex-1">
              <div className="bg-gray-800 p-2 border-b border-gray-700">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingDown size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-green-400">Bids</span>
                </div>
              </div>
              
              <div className="h-full overflow-y-auto">
                {orderbook.bids.slice(0, maxRows).map((bid, index) => (
                  <OrderRow
                    key={`bid-${index}`}
                    order={bid}
                    index={index}
                    side="bid"
                    maxTotal={maxBidTotal}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel - Market Stats */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Market Statistics</h3>
          
          <div className="space-y-4">
            {/* Best Prices */}
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Best Prices</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Best Ask:</span>
                  <span className="text-sm font-mono text-red-400">
                    {orderbook.asks.length > 0 ? formatPrice(orderbook.asks[0].price) : '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Best Bid:</span>
                  <span className="text-sm font-mono text-green-400">
                    {orderbook.bids.length > 0 ? formatPrice(orderbook.bids[0].price) : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Volume Stats */}
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Volume</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Total Bids:</span>
                  <span className="text-sm font-mono text-green-400">
                    {formatSize(maxBidTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Total Asks:</span>
                  <span className="text-sm font-mono text-red-400">
                    {formatSize(maxAskTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Bid/Ask Ratio:</span>
                  <span className="text-sm font-mono text-blue-400">
                    {maxAskTotal > 0 ? (maxBidTotal / maxAskTotal).toFixed(2) : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Trade</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Price:</span>
                  <span className={`text-sm font-mono ${lastTrade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPrice(lastTrade.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Size:</span>
                  <span className="text-sm font-mono text-gray-300">
                    {formatSize(lastTrade.size)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Side:</span>
                  <span className={`text-sm font-medium ${lastTrade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {lastTrade.side.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Update Interval (ms)</label>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={settings.updateInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, updateInterval: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{settings.updateInterval}ms</div>
                </div>
                
                <button
                  onClick={() => setOrderbook(generateInitialOrderbook())}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 p-2 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between">
          <div>
            Last Update: {new Date(orderbook.lastUpdate).toLocaleTimeString()}
          </div>
          <div>
            {orderbook.bids.length} bids, {orderbook.asks.length} asks
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBookComponent;