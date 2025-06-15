"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, Minus, Type, Move, MousePointer, BarChart3, Settings } from 'lucide-react';

// Sample OHLC data generator
const generateSampleData = (days = 100) => {
  const data = [];
  let price = 100;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 0.01 * price;
    const low = Math.min(open, close) - Math.random() * 0.01 * price;
    const volume = Math.floor(Math.random() * 1000000 + 500000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  return data;
};

// Technical indicators
const calculateSMA = (data, period) => {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, item) => acc + item.close, 0);
    return sum / period;
  });
};

const calculateEMA = (data, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  data.forEach((item, index) => {
    if (index === 0) {
      ema.push(item.close);
    } else {
      ema.push((item.close - ema[index - 1]) * multiplier + ema[index - 1]);
    }
  });
  
  return ema;
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine = fastEMA.map((fast, index) => fast - slowEMA[index]);
  const signalLine = calculateEMA(macdLine.map((value, index) => ({ close: value })), signalPeriod);
  const histogram = macdLine.map((macd, index) => macd - signalLine[index]);
  
  return { macdLine, signalLine, histogram };
};

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const sma = calculateSMA(data, period);
  
  return data.map((_, index) => {
    if (index < period - 1) return { upper: null, middle: null, lower: null };
    
    const slice = data.slice(index - period + 1, index + 1);
    const mean = sma[index];
    const variance = slice.reduce((acc, item) => acc + Math.pow(item.close - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: mean + (standardDeviation * stdDev),
      middle: mean,
      lower: mean - (standardDeviation * stdDev)
    };
  });
};

const TradingChart = () => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [data, setData] = useState([]);
  const [selectedTool, setSelectedTool] = useState('pointer');
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [dragOffset, setDragOffset] = useState(null);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    bollinger: false,
    macd: false
  });
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [viewWindow, setViewWindow] = useState({ start: 0, end: 100 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [priceInfo, setPriceInfo] = useState({
    open: '0.00',
    high: '0.00',
    low: '0.00',
    close: '0.00',
    date: '',
    volume: '0'
  });
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side only to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    setData(generateSampleData(100));
  }, []);

  // Calculate price range
  useEffect(() => {
    if (data.length > 0) {
      const visibleData = data.slice(viewWindow.start, viewWindow.end);
      const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
      setPriceRange({
        min: Math.min(...prices) * 0.98,
        max: Math.max(...prices) * 1.02
      });
    }
  }, [data, viewWindow]);

  // Canvas setup
  useEffect(() => {
    if (!isClient) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      setChartDimensions({ width: rect.width, height: rect.height });
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isClient]);

  // Coordinate conversion functions
  const priceToY = useCallback((price) => {
    const { height } = chartDimensions;
    const padding = 40;
    return padding + (priceRange.max - price) / (priceRange.max - priceRange.min) * (height - 2 * padding);
  }, [chartDimensions, priceRange]);

  const indexToX = useCallback((index) => {
    const { width } = chartDimensions;
    const padding = 60;
    const visibleRange = viewWindow.end - viewWindow.start;
    return padding + (index - viewWindow.start) / visibleRange * (width - 2 * padding);
  }, [chartDimensions, viewWindow]);

  const xToIndex = useCallback((x) => {
    const { width } = chartDimensions;
    const padding = 60;
    const visibleRange = viewWindow.end - viewWindow.start;
    return Math.round(viewWindow.start + (x - padding) / (width - 2 * padding) * visibleRange);
  }, [chartDimensions, viewWindow]);

  const yToPrice = useCallback((y) => {
    const { height } = chartDimensions;
    const padding = 40;
    return priceRange.max - (y - padding) / (height - 2 * padding) * (priceRange.max - priceRange.min);
  }, [chartDimensions, priceRange]);

  // Drawing functions
  const drawCandlesticks = useCallback((ctx) => {
    const visibleData = data.slice(viewWindow.start, viewWindow.end);
    
    visibleData.forEach((candle, index) => {
      const x = indexToX(viewWindow.start + index);
      const openY = priceToY(candle.open);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const closeY = priceToY(candle.close);
      
      const candleWidth = Math.max(2, (chartDimensions.width - 120) / visibleData.length * 0.8);
      const isGreen = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x - candleWidth/2, Math.min(openY, closeY), candleWidth, Math.max(bodyHeight, 1));
    });
  }, [data, viewWindow, indexToX, priceToY, chartDimensions]);

  const drawIndicators = useCallback((ctx) => {
    if (indicators.sma20) {
      const sma20 = calculateSMA(data, 20);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      sma20.forEach((value, index) => {
        if (value !== null && index >= viewWindow.start && index < viewWindow.end) {
          const x = indexToX(index);
          const y = priceToY(value);
          if (index === viewWindow.start || sma20[index - 1] === null) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }
    
    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2);
      
      // Upper band
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      bb.forEach((band, index) => {
        if (band.upper !== null && index >= viewWindow.start && index < viewWindow.end) {
          const x = indexToX(index);
          const y = priceToY(band.upper);
          if (index === viewWindow.start) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Lower band
      ctx.beginPath();
      bb.forEach((band, index) => {
        if (band.lower !== null && index >= viewWindow.start && index < viewWindow.end) {
          const x = indexToX(index);
          const y = priceToY(band.lower);
          if (index === viewWindow.start) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }, [data, indicators, viewWindow, indexToX, priceToY]);

  const drawGrid = useCallback((ctx) => {
    const { width, height } = chartDimensions;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = 40 + (i * (height - 80)) / 10;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
      
      // Price labels
      const price = priceRange.max - (i * (priceRange.max - priceRange.min)) / 10;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), 55, y + 4);
    }
    
    // Vertical grid lines
    const visibleData = data.slice(viewWindow.start, viewWindow.end);
    const step = Math.max(1, Math.floor(visibleData.length / 10));
    for (let i = 0; i < visibleData.length; i += step) {
      const x = indexToX(viewWindow.start + i);
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height - 40);
      ctx.stroke();
      
      // Date labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(visibleData[i].date.slice(5), x, height - 20);
    }
  }, [chartDimensions, priceRange, data, viewWindow, indexToX]);

  const drawDrawings = useCallback((ctx) => {
    drawings.forEach((drawing, index) => {
      ctx.strokeStyle = drawing.color || '#ffffff';
      ctx.lineWidth = drawing.lineWidth || 2;
      
      if (drawing.type === 'trendline') {
        ctx.beginPath();
        ctx.moveTo(indexToX(drawing.startIndex), priceToY(drawing.startPrice));
        ctx.lineTo(indexToX(drawing.endIndex), priceToY(drawing.endPrice));
        ctx.stroke();
      } else if (drawing.type === 'horizontal') {
        ctx.beginPath();
        ctx.moveTo(60, priceToY(drawing.price));
        ctx.lineTo(chartDimensions.width - 60, priceToY(drawing.price));
        ctx.stroke();
      } else if (drawing.type === 'text') {
        ctx.fillStyle = drawing.color || '#ffffff';
        ctx.font = `${drawing.fontSize || 14}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(drawing.text, indexToX(drawing.index), priceToY(drawing.price));
      }
      
      // Draw selection handles
      if (selectedDrawing === index) {
        ctx.fillStyle = '#3b82f6';
        if (drawing.type === 'trendline') {
          ctx.fillRect(indexToX(drawing.startIndex) - 3, priceToY(drawing.startPrice) - 3, 6, 6);
          ctx.fillRect(indexToX(drawing.endIndex) - 3, priceToY(drawing.endPrice) - 3, 6, 6);
        } else if (drawing.type === 'horizontal') {
          ctx.fillRect(indexToX(viewWindow.start + 10) - 3, priceToY(drawing.price) - 3, 6, 6);
          ctx.fillRect(indexToX(viewWindow.end - 10) - 3, priceToY(drawing.price) - 3, 6, 6);
        }
      }
    });
  }, [drawings, selectedDrawing, indexToX, priceToY, chartDimensions, viewWindow]);

  const drawCrosshair = useCallback((ctx) => {
    if (!showCrosshair) return;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mousePos.x, 40);
    ctx.lineTo(mousePos.x, chartDimensions.height - 40);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(60, mousePos.y);
    ctx.lineTo(chartDimensions.width - 60, mousePos.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Price label
    const price = yToPrice(mousePos.y);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(chartDimensions.width - 100, mousePos.y - 10, 95, 20);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(price.toFixed(2), chartDimensions.width - 52.5, mousePos.y + 4);
    
    // Date label
    const index = xToIndex(mousePos.x);
    if (index >= 0 && index < data.length) {
      const dateStr = data[index].date.slice(5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mousePos.x - 30, chartDimensions.height - 35, 60, 20);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, mousePos.x, chartDimensions.height - 21);
    }
  }, [showCrosshair, mousePos, chartDimensions, yToPrice, xToIndex, data]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartDimensions.width === 0 || !isClient) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);
    
    // Dark theme background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, chartDimensions.width, chartDimensions.height);
    
    drawGrid(ctx);
    drawCandlesticks(ctx);
    drawIndicators(ctx);
    drawDrawings(ctx);
    drawCrosshair(ctx);
  }, [chartDimensions, drawGrid, drawCandlesticks, drawIndicators, drawDrawings, drawCrosshair, isClient]);

  useEffect(() => {
    render();
  }, [render]);

  // Mouse event handlers
  const getMousePos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const updatePriceInfo = useCallback((pos) => {
    const candleIndex = xToIndex(pos.x);
    if (candleIndex >= 0 && candleIndex < data.length) {
      const candle = data[candleIndex];
      setPriceInfo({
        open: candle.open.toFixed(2),
        high: candle.high.toFixed(2),
        low: candle.low.toFixed(2),
        close: candle.close.toFixed(2),
        date: candle.date,
        volume: candle.volume.toLocaleString()
      });
    }
  }, [data, xToIndex]);

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (selectedTool === 'pointer') {
      // Check if clicking on existing drawing
      const clickedDrawing = drawings.findIndex(drawing => {
        if (drawing.type === 'trendline') {
          const startX = indexToX(drawing.startIndex);
          const startY = priceToY(drawing.startPrice);
          const endX = indexToX(drawing.endIndex);
          const endY = priceToY(drawing.endPrice);
          
          // Simple line hit detection
          const dist = Math.abs((endY - startY) * pos.x - (endX - startX) * pos.y + endX * startY - endY * startX) / 
                      Math.sqrt(Math.pow(endY - startY, 2) + Math.pow(endX - startX, 2));
          return dist < 5;
        } else if (drawing.type === 'horizontal') {
          const lineY = priceToY(drawing.price);
          return Math.abs(pos.y - lineY) < 5 && pos.x > 60 && pos.x < chartDimensions.width - 60;
        }
        return false;
      });
      
      if (clickedDrawing !== -1) {
        setSelectedDrawing(clickedDrawing);
        setDragOffset(pos);
      } else {
        setSelectedDrawing(null);
      }
    } else if (selectedTool === 'trendline') {
      setIsDrawing(true);
      const startIndex = xToIndex(pos.x);
      const startPrice = yToPrice(pos.y);
      setCurrentDrawing({
        type: 'trendline',
        startIndex,
        startPrice,
        endIndex: startIndex,
        endPrice: startPrice,
        color: '#ffffff'
      });
    } else if (selectedTool === 'horizontal') {
      const price = yToPrice(pos.y);
      setDrawings(prev => [...prev, {
        type: 'horizontal',
        price,
        color: '#ffffff'
      }]);
    } else if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const index = xToIndex(pos.x);
        const price = yToPrice(pos.y);
        setDrawings(prev => [...prev, {
          type: 'text',
          text,
          index,
          price,
          color: '#ffffff',
          fontSize: 14
        }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    setMousePos(pos);
    setShowCrosshair(true);
    updatePriceInfo(pos);
    
    if (!isDrawing && !dragOffset) return;
    
    if (isDrawing && currentDrawing) {
      const endIndex = xToIndex(pos.x);
      const endPrice = yToPrice(pos.y);
      setCurrentDrawing(prev => ({
        ...prev,
        endIndex,
        endPrice
      }));
    } else if (dragOffset && selectedDrawing !== null) {
      const drawing = drawings[selectedDrawing];
      const deltaX = pos.x - dragOffset.x;
      const deltaY = pos.y - dragOffset.y;
      
      if (drawing.type === 'trendline') {
        const deltaIndex = xToIndex(dragOffset.x + deltaX) - xToIndex(dragOffset.x);
        const deltaPrice = yToPrice(dragOffset.y + deltaY) - yToPrice(dragOffset.y);
        
        setDrawings(prev => prev.map((d, i) => i === selectedDrawing ? {
          ...d,
          startIndex: d.startIndex + deltaIndex,
          endIndex: d.endIndex + deltaIndex,
          startPrice: d.startPrice + deltaPrice,
          endPrice: d.endPrice + deltaPrice
        } : d));
      } else if (drawing.type === 'horizontal') {
        const newPrice = yToPrice(pos.y);
        setDrawings(prev => prev.map((d, i) => i === selectedDrawing ? {
          ...d,
          price: newPrice
        } : d));
      }
      
      setDragOffset(pos);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
  };

  const handleMouseLeave = () => {
    setShowCrosshair(false);
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && selectedDrawing !== null) {
      setDrawings(prev => prev.filter((_, i) => i !== selectedDrawing));
      setSelectedDrawing(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawing]);
  
  // Render current drawing
  useEffect(() => {
    if (currentDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      render();
      
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indexToX(currentDrawing.startIndex), priceToY(currentDrawing.startPrice));
      ctx.lineTo(indexToX(currentDrawing.endIndex), priceToY(currentDrawing.endPrice));
      ctx.stroke();
    }
  }, [currentDrawing, render, indexToX, priceToY]);

  const tools = [
    { id: 'pointer', icon: MousePointer, label: 'Select' },
    { id: 'trendline', icon: TrendingUp, label: 'Trendline' },
    { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
    { id: 'text', icon: Type, label: 'Text' }
  ];

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Trading Chart</h1>
            <div className="flex items-center space-x-2">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedTool === tool.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={tool.label}
                >
                  <tool.icon size={20} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Indicators:</span>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={indicators.sma20}
                  onChange={(e) => setIndicators(prev => ({ ...prev, sma20: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">SMA 20</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={indicators.bollinger}
                  onChange={(e) => setIndicators(prev => ({ ...prev, bollinger: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Bollinger Bands</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        {isClient ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* OHLC Info Panel */}
            <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 backdrop-blur-sm p-4 rounded-lg border border-gray-600 font-mono text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>O: <span className="text-blue-400">{priceInfo.open}</span></div>
                <div>H: <span className="text-green-400">{priceInfo.high}</span></div>
                <div>L: <span className="text-red-400">{priceInfo.low}</span></div>
                <div>C: <span className="text-yellow-400">{priceInfo.close}</span></div>
              </div>
              <div className="mt-2 text-xs text-gray-300">
                <div>Date: {priceInfo.date}</div>
                <div>Volume: {priceInfo.volume}</div>
              </div>
            </div>
            
            {/* Overlay for text input and other UI elements */}
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Loading chart...
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 p-2 border-t border-gray-700 text-sm">
        <div className="flex items-center justify-between">
          <div>
            Tool: {tools.find(t => t.id === selectedTool)?.label}
            {selectedDrawing !== null && ' | Selected drawing (Press Delete to remove)'}
          </div>
          <div>
            {data.length > 0 && `${data[data.length - 1].date} | Close: $${data[data.length - 1].close.toFixed(2)}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;