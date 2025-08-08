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
  const [viewWindow, setViewWindow] = useState({ start: 0, end: 0 });
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
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  // New states for axis scaling
  const [isYAxisScaling, setIsYAxisScaling] = useState(false);
  const [isXAxisScaling, setIsXAxisScaling] = useState(false);
  const [scaleStartPos, setScaleStartPos] = useState({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState('crosshair'); // State to control canvas cursor

  // Define scale hot zones (padding values already serve as these boundaries)
  const X_AXIS_SCALE_HEIGHT = 40; // Height of the area below the chart for X-axis scaling (bottom padding)
  const Y_AXIS_SCALE_WIDTH = 60;  // Width of the area to the left of the chart for Y-axis scaling (left padding)


  // Initialize client-side only to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    const initialData = generateSampleData(200);
    setData(initialData);
    setViewWindow({
      start: Math.max(0, initialData.length - 100),
      end: initialData.length
    });
  }, []);

  // Calculate price range
  useEffect(() => {
    if (data.length > 0) {
      const visibleData = data.slice(viewWindow.start, viewWindow.end);
      if (visibleData.length === 0) return;
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
    const paddingY = 40;
    const chartHeight = height - 2 * paddingY;
    if (chartHeight <= 0 || priceRange.max === priceRange.min) return paddingY;
    return paddingY + (priceRange.max - price) / (priceRange.max - priceRange.min) * chartHeight;
  }, [chartDimensions, priceRange]);

  const indexToX = useCallback((index) => {
    const { width } = chartDimensions;
    const paddingX = 60;
    const visibleRange = viewWindow.end - viewWindow.start;
    const chartWidth = width - 2 * paddingX;
    if (visibleRange === 0 || chartWidth <= 0) return paddingX;
    return paddingX + (index - viewWindow.start) / visibleRange * chartWidth;
  }, [chartDimensions, viewWindow]);

  const xToIndex = useCallback((x) => {
    const { width } = chartDimensions;
    const paddingX = 60;
    const visibleRange = viewWindow.end - viewWindow.start;
    const chartWidth = width - 2 * paddingX;
    if (chartWidth <= 0) return 0;
    
    const clampedX = Math.max(paddingX, Math.min(x, width - paddingX));
    return Math.round(viewWindow.start + (clampedX - paddingX) / chartWidth * visibleRange);
  }, [chartDimensions, viewWindow]);

  const yToPrice = useCallback((y) => {
    const { height } = chartDimensions;
    const paddingY = 40;
    const chartHeight = height - 2 * paddingY;
    if (chartHeight <= 0 || priceRange.max === priceRange.min) return priceRange.min;
    
    const clampedY = Math.max(paddingY, Math.min(y, height - paddingY));
    return priceRange.max - (clampedY - paddingY) / chartHeight * (priceRange.max - priceRange.min);
  }, [chartDimensions, priceRange]);

  // Drawing functions
  const drawCandlesticks = useCallback((ctx) => {
    const visibleData = data.slice(viewWindow.start, viewWindow.end);
    if (visibleData.length === 0) return;
    
    const availableChartWidth = chartDimensions.width - (2 * 60); // 60px padding on each side
    const candleWidth = Math.max(1, availableChartWidth / (viewWindow.end - viewWindow.start) * 0.8);

    visibleData.forEach((candle, index) => {
      const fullDataIndex = viewWindow.start + index;
      const x = indexToX(fullDataIndex);
      const openY = priceToY(candle.open);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const closeY = priceToY(candle.close);
      
      const isGreen = candle.close > candle.open;
      
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
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
      
      let firstPoint = true;
      for (let index = viewWindow.start; index < viewWindow.end; index++) {
        if (sma20[index] !== null) {
          const x = indexToX(index);
          const y = priceToY(sma20[index]);
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          firstPoint = true;
        }
      }
      ctx.stroke();
    }
    
    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2);
      
      // Upper band
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1;
      let firstUpperPoint = true;
      ctx.beginPath();
      for (let index = viewWindow.start; index < viewWindow.end; index++) {
        if (bb[index].upper !== null) {
          const x = indexToX(index);
          const y = priceToY(bb[index].upper);
          if (firstUpperPoint) {
            ctx.moveTo(x, y);
            firstUpperPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          firstUpperPoint = true;
        }
      }
      ctx.stroke();
      
      // Lower band
      let firstLowerPoint = true;
      ctx.beginPath();
      for (let index = viewWindow.start; index < viewWindow.end; index++) {
        if (bb[index].lower !== null) {
          const x = indexToX(index);
          const y = priceToY(bb[index].lower);
          if (firstLowerPoint) {
            ctx.moveTo(x, y);
            firstLowerPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          firstLowerPoint = true;
        }
      }
      ctx.stroke();
    }
  }, [data, indicators, viewWindow, indexToX, priceToY]);

  const drawGrid = useCallback((ctx) => {
    const { width, height } = chartDimensions;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    const paddingX = 60;
    const paddingY = 40;

    // Horizontal grid lines
    const numHorizontalLines = 10;
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = paddingY + (i * (height - 2 * paddingY)) / numHorizontalLines;
      ctx.beginPath();
      ctx.moveTo(paddingX, y);
      ctx.lineTo(width - paddingX, y);
      ctx.stroke();
      
      // Price labels
      const price = priceRange.max - (i * (priceRange.max - priceRange.min)) / numHorizontalLines;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), paddingX - 5, y + 4);
    }
    
    // Vertical grid lines
    const visibleDataCount = viewWindow.end - viewWindow.start;
    const step = Math.max(1, Math.floor(visibleDataCount / 10));
    
    for (let i = 0; i < visibleDataCount; i += step) {
      const fullDataIndex = viewWindow.start + i;
      if (fullDataIndex >= data.length) break;

      const x = indexToX(fullDataIndex);
      ctx.beginPath();
      ctx.moveTo(x, paddingY);
      ctx.lineTo(x, height - paddingY);
      ctx.stroke();
      
      // Date labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data[fullDataIndex].date.slice(5), x, height - paddingY + 20);
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
          const handleOffset = 20;
          ctx.fillRect(indexToX(viewWindow.start + handleOffset) - 3, priceToY(drawing.price) - 3, 6, 6);
          ctx.fillRect(indexToX(viewWindow.end - handleOffset) - 3, priceToY(drawing.price) - 3, 6, 6);
        }
      }
    });
  }, [drawings, selectedDrawing, indexToX, priceToY, chartDimensions, viewWindow]);

  const drawCrosshair = useCallback((ctx) => {
    if (!showCrosshair) return;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const paddingX = 60;
    const paddingY = 40;
    
    // Vertical line (clamped to chart area)
    ctx.beginPath();
    ctx.moveTo(mousePos.x, paddingY);
    ctx.lineTo(mousePos.x, chartDimensions.height - paddingY);
    ctx.stroke();
    
    // Horizontal line (clamped to chart area)
    ctx.beginPath();
    ctx.moveTo(paddingX, mousePos.y);
    ctx.lineTo(chartDimensions.width - paddingX, mousePos.y);
    ctx.stroke();
    
    ctx.setLineDash([]);

    // Price label
    const price = yToPrice(mousePos.y);
    ctx.fillStyle = '#ffffff';
    const priceLabelWidth = 60;
    const priceLabelHeight = 20;
    const priceLabelX = chartDimensions.width - paddingX;
    const priceLabelY = mousePos.y - priceLabelHeight / 2;
    ctx.fillRect(priceLabelX, priceLabelY, priceLabelWidth, priceLabelHeight);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(price.toFixed(2), priceLabelX + priceLabelWidth / 2, priceLabelY + 14);
    
    // Date label
    const index = xToIndex(mousePos.x);
    if (index >= 0 && index < data.length) {
      const dateStr = data[index].date.slice(5);
      const dateLabelWidth = 70;
      const dateLabelHeight = 20;
      const dateLabelX = mousePos.x - dateLabelWidth / 2;
      const dateLabelY = chartDimensions.height - paddingY;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dateLabelX, dateLabelY, dateLabelWidth, dateLabelHeight);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, dateLabelX + dateLabelWidth / 2, dateLabelY + 14);
    }
  }, [showCrosshair, mousePos, chartDimensions, yToPrice, xToIndex, data]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartDimensions.width === 0 || !isClient || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, chartDimensions.width, chartDimensions.height);
    
    drawGrid(ctx);
    drawCandlesticks(ctx);
    drawIndicators(ctx);
    drawDrawings(ctx);
    drawCrosshair(ctx);
  }, [chartDimensions, drawGrid, drawCandlesticks, drawIndicators, drawDrawings, drawCrosshair, isClient, data.length]);

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
    } else {
      setPriceInfo({
        open: '0.00', high: '0.00', low: '0.00', close: '0.00', date: '', volume: '0'
      });
    }
  }, [data, xToIndex]);

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const { width, height } = chartDimensions;

    // Check if click is on Y-axis scale (left padding area)
    // The clickable area for y-axis is the left padding column
    if (pos.x >= 0 && pos.x <= Y_AXIS_SCALE_WIDTH &&
        pos.y >= 0 && pos.y <= height) { 
      setIsYAxisScaling(true);
      setScaleStartPos(pos);
      setShowCrosshair(false); // Hide crosshair when scaling
      return;
    }

    // Check if click is on X-axis scale (bottom padding area)
    // The clickable area for x-axis is the bottom padding row
    if (pos.y >= height - X_AXIS_SCALE_HEIGHT && pos.y <= height &&
        pos.x >= 0 && pos.x <= width) { 
      setIsXAxisScaling(true);
      setScaleStartPos(pos);
      setShowCrosshair(false); // Hide crosshair when scaling
      return;
    }
    
    // If not on a scale, proceed with existing logic
    if (selectedTool === 'pointer') {
      const clickedDrawing = drawings.findIndex(drawing => {
        if (drawing.type === 'trendline') {
          const startX = indexToX(drawing.startIndex);
          const startY = priceToY(drawing.startPrice);
          const endX = indexToX(drawing.endIndex);
          const endY = priceToY(drawing.endPrice);
          const dist = Math.abs((endY - startY) * pos.x - (endX - startX) * pos.y + endX * startY - endY * startX) / 
                      Math.sqrt(Math.pow(endY - startY, 2) + Math.pow(endX - startX, 2));
          return dist < 5;
        } else if (drawing.type === 'horizontal') {
          const lineY = priceToY(drawing.price);
          return Math.abs(pos.y - lineY) < 5 && pos.x > 60 && pos.x < chartDimensions.width - 60;
        } else if (drawing.type === 'text') {
          const textX = indexToX(drawing.index);
          const textY = priceToY(drawing.price);
          return pos.x >= textX - 5 && pos.x <= textX + 50 && pos.y >= textY - 10 && pos.y <= textY + 10;
        }
        return false;
      });
      
      if (clickedDrawing !== -1) {
        setSelectedDrawing(clickedDrawing);
        setDragOffset(pos);
      } else {
        setSelectedDrawing(null);
      }
    } else if (selectedTool === 'pan') {
      setIsPanning(true);
      setLastPanPos(pos);
      setShowCrosshair(false);
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
    const { width, height } = chartDimensions;

    // Determine cursor style based on hover zones
    let newCursor = 'crosshair'; // Default
    if (isPanning || selectedTool === 'pan') {
      newCursor = isPanning ? 'grabbing' : 'grab';
    } else if (isYAxisScaling) {
      newCursor = 'ns-resize';
    } else if (isXAxisScaling) {
      newCursor = 'ew-resize';
    } else {
      // Check for hover over scale zones to set cursor dynamically
      if (pos.x >= 0 && pos.x <= Y_AXIS_SCALE_WIDTH &&
          pos.y >= 0 && pos.y <= height) {
        newCursor = 'ns-resize';
      } else if (pos.y >= height - X_AXIS_SCALE_HEIGHT && pos.y <= height &&
                 pos.x >= 0 && pos.x <= width) {
        newCursor = 'ew-resize';
      } else if (selectedTool === 'pointer') {
        newCursor = 'default'; // Pointer tool uses default cursor
      }
      // For drawing tools, it's often a crosshair anyway, so default is fine
    }
    setCursorStyle(newCursor);

    // --- Handle Axis Scaling First ---
    if (isYAxisScaling) {
      const deltaY = pos.y - scaleStartPos.y;
      const paddingY = 40;
      const chartHeight = height - 2 * paddingY;
      if (chartHeight <= 0 || priceRange.max === priceRange.min) {
        setScaleStartPos(pos); // Still update to avoid huge jump if chartHeight becomes valid
        return;
      }

      const currentPriceRangeHeight = priceRange.max - priceRange.min;
      const sensitivity = 0.005; // Adjust sensitivity as needed
      const priceChange = deltaY * sensitivity * (currentPriceRangeHeight / chartHeight);

      setPriceRange(prev => {
          let newMax = prev.max - priceChange;
          let newMin = prev.min + priceChange;
          
          const MIN_PRICE_RANGE_DIFF = 0.5; // Prevent extremely small ranges
          if (newMax - newMin < MIN_PRICE_RANGE_DIFF) {
              // Scale around the midpoint to maintain visual stability
              const midpoint = (prev.min + prev.max) / 2;
              newMin = midpoint - MIN_PRICE_RANGE_DIFF / 2;
              newMax = midpoint + MIN_PRICE_RANGE_DIFF / 2;
          }

          return { min: newMin, max: newMax };
      });
      setScaleStartPos(pos);
      setShowCrosshair(false);
      return;
    }

    if (isXAxisScaling) {
      const deltaX = pos.x - scaleStartPos.x;
      const paddingX = 60;
      const chartWidth = width - 2 * paddingX;
      const currentVisibleRange = viewWindow.end - viewWindow.start;
      if (chartWidth <= 0 || currentVisibleRange === 0) {
        setScaleStartPos(pos);
        return;
      }

      const sensitivity = 0.005;
      const indexChange = deltaX * sensitivity * (currentVisibleRange / chartWidth);

      setViewWindow(prev => {
          let newRange = Math.round(currentVisibleRange + indexChange);

          newRange = Math.max(5, Math.min(newRange, data.length)); // Min 5 candles

          const viewCenterIndex = prev.start + currentVisibleRange / 2;
          let newStart = Math.round(viewCenterIndex - newRange / 2);
          let newEnd = newStart + newRange;

          if (newStart < 0) {
              newStart = 0;
              newEnd = newRange;
          }
          if (newEnd > data.length) {
              newEnd = data.length;
              newStart = newEnd - newRange;
          }
          if (newStart < 0) newStart = 0;

          return { start: newStart, end: newEnd };
      });
      setScaleStartPos(pos);
      setShowCrosshair(false);
      return;
    }

    // --- If not scaling, proceed with existing logic ---
    const inChartBounds = pos.x > 60 && pos.x < chartDimensions.width - 60 &&
                         pos.y > 40 && pos.y < chartDimensions.height - 40;
    setShowCrosshair(!isPanning && !isDrawing && inChartBounds);
    updatePriceInfo(pos);
    
    if (isDrawing && currentDrawing) {
      const endIndex = xToIndex(pos.x);
      const endPrice = yToPrice(pos.y);
      setCurrentDrawing(prev => ({ ...prev, endIndex, endPrice }));
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
        setDrawings(prev => prev.map((d, i) => i === selectedDrawing ? { ...d, price: newPrice } : d));
      } else if (drawing.type === 'text') {
        const deltaIndex = xToIndex(dragOffset.x + deltaX) - xToIndex(dragOffset.x);
        const deltaPrice = yToPrice(dragOffset.y + deltaY) - yToPrice(dragOffset.y);
        setDrawings(prev => prev.map((d, i) => i === selectedDrawing ? {
          ...d, index: d.index + deltaIndex, price: d.price + deltaPrice
        } : d));
      }
      setDragOffset(pos);
    } else if (isPanning) {
      const deltaX = pos.x - lastPanPos.x;
      const deltaY = pos.y - lastPanPos.y;

      const visibleDataCount = viewWindow.end - viewWindow.start;
      const chartWidth = chartDimensions.width - (2 * 60);
      const dataPerPixelX = visibleDataCount / (chartWidth === 0 ? 1 : chartWidth);
      const dataShiftX = Math.round(deltaX * dataPerPixelX);
      
      setViewWindow(prev => {
        let newStart = prev.start - dataShiftX;
        let newEnd = prev.end - dataShiftX;

        if (newStart < 0) { newStart = 0; newEnd = newStart + visibleDataCount; }
        if (newEnd > data.length) { newEnd = data.length; newStart = newEnd - visibleDataCount; }
        if (newStart < 0) newStart = 0;

        return { start: newStart, end: newEnd };
      });

      const priceRangeHeight = priceRange.max - priceRange.min;
      const chartHeight = chartDimensions.height - (2 * 40);
      const pricePerPixelY = priceRangeHeight / (chartHeight === 0 ? 1 : chartHeight);
      const priceShiftY = deltaY * pricePerPixelY;

      setPriceRange(prev => ({
        min: prev.min + priceShiftY,
        max: prev.max + priceShiftY
      }));

      setLastPanPos(pos);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
    setIsPanning(false);
    setIsYAxisScaling(false);
    setIsXAxisScaling(false);
  };

  const handleMouseLeave = () => {
    setShowCrosshair(false);
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
    setIsPanning(false);
    setIsYAxisScaling(false);
    setIsXAxisScaling(false);
    setCursorStyle('crosshair'); // Reset cursor on leave
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

  const handleWheel = useCallback((e) => {
    e.preventDefault();

    const mouseX = e.clientX - canvasRef.current.getBoundingClientRect().left;
    const initialIndexAtMouse = xToIndex(mouseX);

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    setViewWindow(prev => {
      const currentRange = prev.end - prev.start;
      if (currentRange === 0) return prev;

      let newRange = Math.round(currentRange * zoomFactor);
      newRange = Math.max(5, Math.min(newRange, data.length));
      
      let newStart = Math.round(initialIndexAtMouse - (initialIndexAtMouse - prev.start) * (newRange / currentRange));
      let newEnd = newStart + newRange;

      if (newStart < 0) { newStart = 0; newEnd = newRange; }
      if (newEnd > data.length) { newEnd = data.length; newStart = newEnd - newRange; }
      if (newStart < 0) newStart = 0;

      return { start: newStart, end: newEnd };
    });
  }, [xToIndex, data.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);
  
  useEffect(() => {
    if (currentDrawing && isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      render();
      
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indexToX(currentDrawing.startIndex), priceToY(currentDrawing.startPrice));
      ctx.lineTo(indexToX(currentDrawing.endIndex), priceToY(currentDrawing.endPrice));
      ctx.stroke();
    }
  }, [currentDrawing, isDrawing, render, indexToX, priceToY]);

  const tools = [
    { id: 'pointer', icon: MousePointer, label: 'Select' },
    { id: 'pan', icon: Move, label: 'Pan' },
    { id: 'trendline', icon: TrendingUp, label: 'Trendline' },
    { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
    { id: 'text', icon: Type, label: 'Text' }
  ];

  return (
    <div className="w-full h-screen bg-white text-white flex flex-col">
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
              className="w-full bg-white h-full"
              style={{ width: '100%', height: '100%', cursor: cursorStyle }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
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