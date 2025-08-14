"use client"
import { MarketData, Order, OrderBook, OrderBookEngine, Update } from "@/order-book/main";
import { useCallback, useEffect, useRef, useState } from "react";

const OrderBookEngineDemo: React.FC = () => {
  const [orderbook, setOrderbook] = useState<OrderBook>({ bids: [], asks: [], lastUpdate: 0, sequence: 0 });
  const [marketData, setMarketData] = useState<MarketData>({} as MarketData);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [flashingOrders, setFlashingOrders] = useState<Set<string>>(new Set());
  const engineRef = useRef<OrderBookEngine | null>(null);

  useEffect(() => {
    const engine = new OrderBookEngine({
      basePrice: 50000,
      priceStep: 0.01,
      maxSize: 1000,
      updateInterval: 200,
      maxRows: 15
    });

    engineRef.current = engine;

    const unsubscribe = engine.subscribe((event: string, data: any) => {
      setUpdateCount(prev => prev + 1);
      
      switch (event) {
        case 'update':
          setOrderbook(data.orderbook);
          setMarketData(engine.getMarketData());
          
          const flashingIds = new Set<string>();
          data.updates.forEach((update: Update) => {
            if (update.type === 'update' || update.type === 'add') {
              if (update.orderId) {
                flashingIds.add(update.orderId);
              }
            }
          });
          
          if (flashingIds.size > 0) {
            setFlashingOrders(flashingIds);
            setTimeout(() => setFlashingOrders(new Set()), 300);
          }
          break;
          
        case 'reset':
          setOrderbook(data.orderbook);
          setMarketData(engine.getMarketData());
          setLogs([]);
          setFlashingOrders(new Set());
          break;
          
        case 'trade':
          setLogs(prev => [
            `Trade: ${data.size.toFixed(4)} @ ${data.price.toFixed(2)} (${data.side})`,
            ...prev.slice(0, 9)
          ]);
          break;
          
        case 'orderAdded':
          setLogs(prev => [
            `Order Added: ${data.order.size.toFixed(4)} @ ${data.order.price.toFixed(2)} (${data.side})`,
            ...prev.slice(0, 9)
          ]);
          break;
      }
    });

    setOrderbook(engine.getOrderbook());
    setMarketData(engine.getMarketData());

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, []);

  const handleStart = useCallback(() => {
    engineRef.current?.start();
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const handleAddOrder = useCallback(() => {
    if (!engineRef.current) return;
    
    const side: 'bid' | 'ask' = Math.random() > 0.5 ? 'bid' : 'ask';
    const bestPrices = engineRef.current.getBestPrices();
    const basePrice = side === 'bid' ? bestPrices.bestBid : bestPrices.bestAsk;
    
    if (basePrice) {
      const priceOffset = (Math.random() - 0.5) * 0.1;
      const price = basePrice + priceOffset;
      const size = Math.random() * 100 + 10;
      
      engineRef.current.addOrder(side, price, size);
    }
  }, []);

  const formatPrice = (price?: number): string => price?.toFixed(2) || '--';
  const formatSize = (size?: number): string => size?.toFixed(4) || '--';

  return (
    <div className="w-full h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Order Book Engine Demo</h1>
          <p className="text-gray-400">
            Demonstrates a standalone order book engine with realistic market simulation
          </p>
        </div>

        <div className="mb-6 flex items-center space-x-4">
          <button
            onClick={isRunning ? handleStop : handleStart}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? 'Stop Engine' : 'Start Engine'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Reset Data
          </button>
          
          <button
            onClick={handleAddOrder}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            Add Random Order
          </button>
          
          <div className="text-sm text-gray-400">
            Updates: {updateCount} | Status: {isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Market Statistics</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Best Bid:</span>
                <span className="text-green-400 font-mono">
                  {formatPrice(orderbook.bids[0]?.price)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Best Ask:</span>
                <span className="text-red-400 font-mono">
                  {formatPrice(orderbook.asks[0]?.price)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Spread:</span>
                <span className="text-yellow-400 font-mono">
                  {formatPrice(marketData.spread?.absolute)} ({marketData.spread?.percentage?.toFixed(3)}%)
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Last Trade:</span>
                <span className={`font-mono ${
                  marketData.lastTrade?.side === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPrice(marketData.lastTrade?.price)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Bid Volume:</span>
                <span className="text-green-400 font-mono">
                  {formatSize(marketData.volume?.bidTotal)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Ask Volume:</span>
                <span className="text-red-400 font-mono">
                  {formatSize(marketData.volume?.askTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Order Book</h3>
            
            <div className="text-xs text-gray-400 mb-2 grid grid-cols-3 gap-2">
              <div className="text-right">Price</div>
              <div className="text-right">Size</div>
              <div className="text-right">Total</div>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-red-400 mb-2">Asks</div>
              {orderbook.asks.slice(0, 8).reverse().map((ask: Order) => {
                const isFlashing = flashingOrders.has(ask.id);
                return (
                  <div 
                    key={ask.id} 
                    className={`text-xs font-mono grid grid-cols-3 gap-2 py-1 transition-all duration-300 ${
                      isFlashing ? 'bg-red-500/20' : ''
                    }`}
                  >
                    <div className="text-right text-red-400">{formatPrice(ask.price)}</div>
                    <div className="text-right text-gray-300">{formatSize(ask.size)}</div>
                    <div className="text-right text-gray-500">{formatSize(ask.total)}</div>
                  </div>
                );
              })}
            </div>
            
            <div>
              <div className="text-sm text-green-400 mb-2">Bids</div>
              {orderbook.bids.slice(0, 8).map((bid: Order) => {
                const isFlashing = flashingOrders.has(bid.id);
                return (
                  <div 
                    key={bid.id} 
                    className={`text-xs font-mono grid grid-cols-3 gap-2 py-1 transition-all duration-300 ${
                      isFlashing ? 'bg-green-500/20' : ''
                    }`}
                  >
                    <div className="text-right text-green-400">{formatPrice(bid.price)}</div>
                    <div className="text-right text-gray-300">{formatSize(bid.size)}</div>
                    <div className="text-right text-gray-500">{formatSize(bid.total)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
            
            <div className="space-y-1 text-xs font-mono">
              {logs.length === 0 ? (
                <div className="text-gray-500">No activity yet...</div>
              ) : (
                logs.map((log: string, index: number) => (
                  <div key={index} className="text-gray-300">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBookEngineDemo;