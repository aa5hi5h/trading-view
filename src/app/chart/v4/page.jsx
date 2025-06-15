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
  const [viewWindow, setViewWindow] = useState({ start: 0, end: 0 }); // Updated initial state
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
  const [isPanning, setIsPanning] = useState(false); // New state for panning
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 }); // New state to track last mouse pos for pan

  // Initialize client-side only to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    const initialData = generateSampleData(200); // Generate more data for better pan/zoom testing
    setData(initialData);
    // Set initial view to last 100 candles, or all if less than 100
    setViewWindow({
      start: Math.max(0, initialData.length - 100),
      end: initialData.length
    });
  }, []);

  // Calculate price range
  useEffect(() => {
    if (data.length > 0) {
      const visibleData = data.slice(viewWindow.start, viewWindow.end);
      if (visibleData.length === 0) return; // Handle empty visible data
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
    const paddingY = 40; // Top/Bottom padding
    const chartHeight = height - 2 * paddingY;
    if (chartHeight <= 0 || priceRange.max === priceRange.min) return paddingY; // Avoid division by zero
    return paddingY + (priceRange.max - price) / (priceRange.max - priceRange.min) * chartHeight;
  }, [chartDimensions, priceRange]);

  const indexToX = useCallback((index) => {
    const { width } = chartDimensions;
    const paddingX = 60; // Left/Right padding
    const visibleRange = viewWindow.end - viewWindow.start;
    const chartWidth = width - 2 * paddingX;
    if (visibleRange === 0 || chartWidth <= 0) return paddingX; // Avoid division by zero
    return paddingX + (index - viewWindow.start) / visibleRange * chartWidth;
  }, [chartDimensions, viewWindow]);

  const xToIndex = useCallback((x) => {
    const { width } = chartDimensions;
    const paddingX = 60; // Left/Right padding
    const visibleRange = viewWindow.end - viewWindow.start;
    const chartWidth = width - 2 * paddingX;
    if (chartWidth <= 0) return 0; // Avoid division by zero
    
    // Clamp x to be within the chart's x-axis bounds
    const clampedX = Math.max(paddingX, Math.min(x, width - paddingX));

    return Math.round(viewWindow.start + (clampedX - paddingX) / chartWidth * visibleRange);
  }, [chartDimensions, viewWindow]);

  const yToPrice = useCallback((y) => {
    const { height } = chartDimensions;
    const paddingY = 40; // Top/Bottom padding
    const chartHeight = height - 2 * paddingY;
    if (chartHeight <= 0 || priceRange.max === priceRange.min) return priceRange.min; // Avoid division by zero
    
    // Clamp y to be within the chart's y-axis bounds
    const clampedY = Math.max(paddingY, Math.min(y, height - paddingY));

    return priceRange.max - (clampedY - paddingY) / chartHeight * (priceRange.max - priceRange.min);
  }, [chartDimensions, priceRange]);

  // Drawing functions
  const drawCandlesticks = useCallback((ctx) => {
    const visibleData = data.slice(viewWindow.start, viewWindow.end);
    if (visibleData.length === 0) return;
    
    const availableChartWidth = chartDimensions.width - 120; // 60px padding on each side
    const candleWidth = Math.max(1, availableChartWidth / visibleData.length * 0.8);

    visibleData.forEach((candle, index) => {
      const fullDataIndex = viewWindow.start + index; // Use the original index in data array
      const x = indexToX(fullDataIndex);
      const openY = priceToY(candle.open);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const closeY = priceToY(candle.close);
      
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
    // We need to pass the slice of data corresponding to the full data set for calculations
    // then filter the drawing to only visible indices
    
    if (indicators.sma20) {
      const sma20 = calculateSMA(data, 20); // Calculate for full data
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
          firstPoint = true; // Reset if there's a null value
        }
      }
      ctx.stroke();
    }
    
    if (indicators.bollinger) {
      const bb = calculateBollingerBands(data, 20, 2); // Calculate for full data
      
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
    const step = Math.max(1, Math.floor(visibleDataCount / 10)); // ~10 vertical lines
    
    for (let i = 0; i < visibleDataCount; i += step) {
      const fullDataIndex = viewWindow.start + i;
      if (fullDataIndex >= data.length) break; // Ensure index is within data bounds

      const x = indexToX(fullDataIndex);
      ctx.beginPath();
      ctx.moveTo(x, paddingY);
      ctx.lineTo(x, height - paddingY);
      ctx.stroke();
      
      // Date labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data[fullDataIndex].date.slice(5), x, height - paddingY + 20); // Adjusted Y for date labels
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
          // Positions for selection handles on a horizontal line
          const handleOffset = 20; // pixels from the edge of chart area
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
    ctx.setLineDash([5, 5]); // Dashed line

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
    
    ctx.setLineDash([]); // Reset line dash

    // Price label
    const price = yToPrice(mousePos.y);
    ctx.fillStyle = '#ffffff';
    const priceLabelWidth = 60; // Adjusted width
    const priceLabelHeight = 20;
    const priceLabelX = chartDimensions.width - paddingX; // Align to right padding edge
    const priceLabelY = mousePos.y - priceLabelHeight / 2;
    ctx.fillRect(priceLabelX, priceLabelY, priceLabelWidth, priceLabelHeight);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(price.toFixed(2), priceLabelX + priceLabelWidth / 2, priceLabelY + 14); // Adjusted text Y

    // Date label
    const index = xToIndex(mousePos.x);
    if (index >= 0 && index < data.length) {
      const dateStr = data[index].date.slice(5);
      const dateLabelWidth = 70; // Adjusted width
      const dateLabelHeight = 20;
      const dateLabelX = mousePos.x - dateLabelWidth / 2;
      const dateLabelY = chartDimensions.height - paddingY; // Align to bottom padding edge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dateLabelX, dateLabelY, dateLabelWidth, dateLabelHeight);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(dateStr, dateLabelX + dateLabelWidth / 2, dateLabelY + 14); // Adjusted text Y
    }
  }, [showCrosshair, mousePos, chartDimensions, yToPrice, xToIndex, data]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartDimensions.width === 0 || !isClient || data.length === 0) return;
    
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
      setPriceInfo({ // Reset if mouse out of bounds or no data
        open: '0.00',
        high: '0.00',
        low: '0.00',
        close: '0.00',
        date: '',
        volume: '0'
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
          // Check if click is on the line and within chart X bounds
          return Math.abs(pos.y - lineY) < 5 && pos.x > 60 && pos.x < chartDimensions.width - 60;
        } else if (drawing.type === 'text') {
          const textX = indexToX(drawing.index);
          const textY = priceToY(drawing.price);
          // Simple bounding box for text hit detection
          const font = `${drawing.fontSize || 14}px Arial`;
          // Need to measure text width, but for simplicity, use a fixed small box
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
    } else if (selectedTool === 'pan') { // Handle panning
      setIsPanning(true);
      setLastPanPos(pos);
      setShowCrosshair(false); // Hide crosshair when panning
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
    
    // Only show crosshair when not panning or drawing, and within chart bounds
    const inChartBounds = pos.x > 60 && pos.x < chartDimensions.width - 60 &&
                         pos.y > 40 && pos.y < chartDimensions.height - 40;
    setShowCrosshair(!isPanning && !isDrawing && inChartBounds);

    updatePriceInfo(pos);
    
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
      } else if (drawing.type === 'text') {
        const deltaIndex = xToIndex(dragOffset.x + deltaX) - xToIndex(dragOffset.x);
        const deltaPrice = yToPrice(dragOffset.y + deltaY) - yToPrice(dragOffset.y);
        setDrawings(prev => prev.map((d, i) => i === selectedDrawing ? {
          ...d,
          index: d.index + deltaIndex,
          price: d.price + deltaPrice
        } : d));
      }
      
      setDragOffset(pos);
    } else if (isPanning) { // Panning logic
      const deltaX = pos.x - lastPanPos.x;
      const deltaY = pos.y - lastPanPos.y;

      // Pan X-axis (Time)
      const visibleDataCount = viewWindow.end - viewWindow.start;
      const chartWidth = chartDimensions.width - 120; // (width - 2*paddingX)
      const dataPerPixelX = visibleDataCount / (chartWidth === 0 ? 1 : chartWidth);
      const dataShiftX = Math.round(deltaX * dataPerPixelX);
      
      setViewWindow(prev => {
        let newStart = prev.start - dataShiftX;
        let newEnd = prev.end - dataShiftX;

        // Boundary checks for X-axis
        if (newStart < 0) {
          newStart = 0;
          newEnd = newStart + visibleDataCount;
        }
        if (newEnd > data.length) {
          newEnd = data.length;
          newStart = newEnd - visibleDataCount;
        }
        if (newStart < 0) newStart = 0; // Final check to ensure non-negative start

        return { start: newStart, end: newEnd };
      });

      // Pan Y-axis (Price)
      const priceRangeHeight = priceRange.max - priceRange.min;
      const chartHeight = chartDimensions.height - 80; // (height - 2*paddingY)
      const pricePerPixelY = priceRangeHeight / (chartHeight === 0 ? 1 : chartHeight);
      const priceShiftY = deltaY * pricePerPixelY;

      setPriceRange(prev => ({
        min: prev.min + priceShiftY,
        max: prev.max + priceShiftY
      }));

      setLastPanPos(pos); // Update last position for continuous panning
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
    setIsPanning(false); // Reset panning state
  };

  const handleMouseLeave = () => {
    setShowCrosshair(false);
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
    setDragOffset(null);
    setIsPanning(false); // Reset panning state
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

  // Mouse Wheel Zoom (X-axis)
  const handleWheel = useCallback((e) => {
    e.preventDefault(); // Prevent page scrolling

    const mouseX = e.clientX - canvasRef.current.getBoundingClientRect().left;
    const initialIndexAtMouse = xToIndex(mouseX);

    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // Zoom out if deltaY > 0, zoom in if deltaY < 0

    setViewWindow(prev => {
      const currentRange = prev.end - prev.start;
      if (currentRange === 0) return prev; // Avoid division by zero

      let newRange = Math.round(currentRange * zoomFactor);

      // Clamp new range to reasonable limits (e.g., min 10 candles, max all data)
      newRange = Math.max(10, Math.min(newRange, data.length));
      
      // Maintain the relative position of the mouse's initial index
      let newStart = Math.round(initialIndexAtMouse - (initialIndexAtMouse - prev.start) * (newRange / currentRange));
      let newEnd = newStart + newRange;

      // Adjust to boundaries
      if (newStart < 0) {
        newStart = 0;
        newEnd = newRange;
      }
      if (newEnd > data.length) {
        newEnd = data.length;
        newStart = newEnd - newRange;
      }
      
      // Final check to ensure newStart is not negative after adjustments
      if (newStart < 0) newStart = 0;

      return { start: newStart, end: newEnd };
    });
  }, [xToIndex, data.length]); // Dependencies for useCallback

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Add passive: false to allow preventDefault for wheel event
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);
  
  // Render current drawing
  useEffect(() => {
    if (currentDrawing && isDrawing) { // Only render if drawing is active
      const canvas = canvasRef.current;
      if (!canvas) return; // Guard clause
      const ctx = canvas.getContext('2d');
      
      render(); // Re-render the entire chart first to clear previous temporary drawing
      
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
    { id: 'pan', icon: Move, label: 'Pan' }, // New Pan tool
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
              className={`w-full h-full ${selectedTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              // onWheel event listener is added in useEffect
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
            
            {/* Overlay for text input and other UI elements (Currently unused but good to keep if needed) */}
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