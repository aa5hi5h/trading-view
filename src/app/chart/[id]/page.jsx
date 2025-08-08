"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';

const CandlestickChart = () => {
  const canvasRef = useRef(null);
  const [drawMode, setDrawMode] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');
  const [candleStyle, setCandleStyle] = useState('traditional');
  const [priceInfo, setPriceInfo] = useState({
    open: '-',
    high: '-',
    low: '-',
    close: '-',
    date: '-'
  });

  // Chart state
  const chartStateRef = useRef({
    data: [],
    trendlines: [],
    isDrawing: false,
    currentLine: null,
    padding: { top: 50, right: 100, bottom: 50, left: 80 },
    candleWidth: 8,
    candleSpacing: 4
  });

  const generateSampleData = useCallback(() => {
    const data = [];
    let price = 150;
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const volatility = 0.02;
      const trend = 0.001;
      
      const open = price;
      const change = (Math.random() - 0.5) * price * volatility + price * trend;
      const close = open + change;
      
      const high = Math.max(open, close) + Math.random() * price * 0.01;
      const low = Math.min(open, close) - Math.random() * price * 0.01;
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100
      });
      
      price = close;
    }
    
    return data;
  }, []);

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const drawGrid = useCallback((ctx, canvas, padding) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    const timeGridLines = 10;
    for (let i = 0; i <= timeGridLines; i++) {
      const x = padding.left + (i * chartWidth / timeGridLines);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, canvas.height - padding.bottom);
      ctx.stroke();
    }
    
    const priceGridLines = 8;
    for (let i = 0; i <= priceGridLines; i++) {
      const y = padding.top + (i * chartHeight / priceGridLines);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
    }
  }, []);

  const drawCandle = useCallback((ctx, canvas, candle, x, minPrice, priceRange, chartHeight, style, padding) => {
    const flippedHighY = canvas.height - padding.bottom - ((candle.high - minPrice) / priceRange) * chartHeight;
    const flippedLowY = canvas.height - padding.bottom - ((candle.low - minPrice) / priceRange) * chartHeight;
    const flippedOpenY = canvas.height - padding.bottom - ((candle.open - minPrice) / priceRange) * chartHeight;
    const flippedCloseY = canvas.height - padding.bottom - ((candle.close - minPrice) / priceRange) * chartHeight;
    
    const isGreen = candle.close > candle.open;
    const color = isGreen ? '#00ff88' : '#ff4757';
    const candleWidth = chartStateRef.current.candleWidth;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, flippedHighY);
    ctx.lineTo(x + candleWidth / 2, flippedLowY);
    ctx.stroke();
    
    const bodyTop = Math.min(flippedOpenY, flippedCloseY);
    const bodyHeight = Math.abs(flippedCloseY - flippedOpenY);
    
    if (style === 'hollow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
    }
  }, []);

  const drawLineChart = useCallback((ctx, canvas, candle, index, minPrice, priceRange, chartHeight, padding) => {
    const candleWidth = chartStateRef.current.candleWidth;
    const candleSpacing = chartStateRef.current.candleSpacing;
    const x = padding.left + index * (candleWidth + candleSpacing) + candleWidth / 2;
    const y = canvas.height - padding.bottom - ((candle.close - minPrice) / priceRange) * chartHeight;
    
    if (index === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#00d2d3';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawPriceAxis = useCallback((ctx, canvas, minPrice, maxPrice, padding) => {
    const chartHeight = canvas.height - padding.top - padding.bottom;
    const priceGridLines = 8;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - padding.right, padding.top, padding.right, chartHeight);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    
    for (let i = 0; i <= priceGridLines; i++) {
      const price = maxPrice - (i / priceGridLines) * (maxPrice - minPrice);
      const y = padding.top + (i * chartHeight / priceGridLines);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width - padding.right - 5, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
      
      ctx.fillText('$' + price.toFixed(2), canvas.width - padding.right + 8, y + 4);
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding.right, padding.top);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();
  }, []);

  const drawTimeAxis = useCallback((ctx, canvas, data, padding) => {
    const chartWidth = canvas.width - padding.left - padding.right;
    const timeGridLines = 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(padding.left, canvas.height - padding.bottom, chartWidth, padding.bottom);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= timeGridLines; i++) {
      const x = padding.left + (i * chartWidth / timeGridLines);
      const dataIndex = Math.floor((i / timeGridLines) * (data.length - 1));
      
      if (dataIndex < data.length) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - padding.bottom);
        ctx.lineTo(x, canvas.height - padding.bottom + 5);
        ctx.stroke();
        
        const date = new Date(data[dataIndex].date);
        const dateStr = (date.getMonth() + 1) + '/' + date.getDate();
        ctx.fillText(dateStr, x, canvas.height - padding.bottom + 18);
      }
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();
  }, []);

  const drawLine = useCallback((ctx, line) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { data, trendlines, padding } = chartStateRef.current;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    drawGrid(ctx, canvas, padding);
    drawPriceAxis(ctx, canvas, minPrice, maxPrice, padding);
    drawTimeAxis(ctx, canvas, data, padding);
    
    const chartHeight = canvas.height - padding.top - padding.bottom;
    
    data.forEach((candle, index) => {
      const x = padding.left + index * (chartStateRef.current.candleWidth + chartStateRef.current.candleSpacing);
      
      if (candleStyle === 'line') {
        drawLineChart(ctx, canvas, candle, index, minPrice, priceRange, chartHeight, padding);
      } else {
        drawCandle(ctx, canvas, candle, x, minPrice, priceRange, chartHeight, candleStyle, padding);
      }
    });
    
    trendlines.forEach(line => drawLine(ctx, line));
  }, [candleStyle, drawGrid, drawPriceAxis, drawTimeAxis, drawLineChart, drawCandle, drawLine]);

  const showCandleInfo = useCallback((pos) => {
    const { data, padding, candleWidth, candleSpacing } = chartStateRef.current;
    const candleIndex = Math.floor((pos.x - padding.left) / (candleWidth + candleSpacing));
    
    if (candleIndex >= 0 && candleIndex < data.length) {
      const candle = data[candleIndex];
      setPriceInfo({
        open: candle.open.toFixed(2),
        high: candle.high.toFixed(2),
        low: candle.low.toFixed(2),
        close: candle.close.toFixed(2),
        date: candle.date
      });
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    const pos = getMousePos(e);
    
    if (drawMode) {
      chartStateRef.current.isDrawing = true;
      chartStateRef.current.currentLine = {
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y,
        color: 'hsl(' + Math.random() * 360 + ', 70%, 60%)'
      };
    }
  }, [drawMode, getMousePos]);

  const handleMouseMove = useCallback((e) => {
    const pos = getMousePos(e);
    const chartState = chartStateRef.current;
    
    if (chartState.isDrawing && chartState.currentLine) {
      chartState.currentLine.endX = pos.x;
      chartState.currentLine.endY = pos.y;
      draw();
      
      // Draw temp line
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const line = chartState.currentLine;
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(line.startX, line.startY);
      ctx.lineTo(line.endX, line.endY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (!drawMode) {
      showCandleInfo(pos);
    }
  }, [drawMode, getMousePos, draw, showCandleInfo]);

  const handleMouseUp = useCallback(() => {
    const chartState = chartStateRef.current;
    if (chartState.isDrawing && chartState.currentLine) {
      chartState.trendlines.push({ ...chartState.currentLine });
      chartState.isDrawing = false;
      chartState.currentLine = null;
      draw();
    }
  }, [draw]);

  const handleDrawTrendClick = () => {
    setDrawMode(!drawMode);
  };

  const handleClearAll = () => {
    chartStateRef.current.trendlines = [];
    draw();
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
    chartStateRef.current.data = generateSampleData();
    draw();
  };

  const handleCandleStyleChange = (e) => {
    setCandleStyle(e.target.value);
  };

  // Initialize chart data and draw
  useEffect(() => {
    chartStateRef.current.data = generateSampleData();
    draw();
  }, [generateSampleData, draw]);

  // Redraw when candleStyle changes
  useEffect(() => {
    draw();
  }, [candleStyle, draw]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-5">
      <div className="max-w-6xl mx-auto bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
        <h1 className="text-center text-4xl font-bold mb-8 drop-shadow-lg">
          Interactive Candlestick Chart
        </h1>
        
        <div className="flex justify-between items-center flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3 bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
            <button
              onClick={handleDrawTrendClick}
              className={`px-5 py-3 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-1 ${
                drawMode 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-400 shadow-lg shadow-teal-500/40' 
                  : 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-orange-500/40'
              }`}
            >
              {drawMode ? 'Drawing Mode' : 'Draw Trendline'}
            </button>
            <button
              onClick={handleClearAll}
              className="bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-orange-500/40"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-white text-black bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
            <label>Timeframe:</label>
            <select
              value={timeframe}
              onChange={handleTimeframeChange}
              className="bg-white bg-opacity-10 text-white border border-white border-opacity-30 px-3 py-2 rounded-2xl backdrop-blur-sm"
            >
              <option value="1D" className="bg-blue-800 text-white">1 Day</option>
              <option value="1W" className="bg-blue-800 text-white">1 Week</option>
              <option value="1M" className="bg-blue-800 text-white">1 Month</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3 bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
            <label>Style:</label>
            <select
              value={candleStyle}
              onChange={handleCandleStyleChange}
              className="bg-white bg-opacity-10 text-white border border-white border-opacity-30 px-3 py-2 rounded-2xl backdrop-blur-sm"
            >
              <option value="traditional" className="bg-blue-800 text-white">Traditional</option>
              <option value="hollow" className="bg-blue-800 text-white">Hollow</option>
              <option value="line" className="bg-blue-800 text-white">Line Chart</option>
            </select>
          </div>
        </div>

        <div className="bg-black bg-opacity-80 rounded-2xl p-5 mb-5 relative shadow-inner">
          <canvas
            ref={canvasRef}
            width={1140}
            height={600}
            className={`border-2 border-white border-opacity-20 rounded-xl bg-gradient-to-b from-gray-900 via-blue-900 to-blue-800 ${
              drawMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          <div className="absolute top-8 right-8 bg-black bg-opacity-80 p-4 rounded-xl font-mono text-sm border border-white border-opacity-20 backdrop-blur-lg">
            <div>O: <span>{priceInfo.open}</span></div>
            <div>H: <span>{priceInfo.high}</span></div>
            <div>L: <span>{priceInfo.low}</span></div>
            <div>C: <span>{priceInfo.close}</span></div>
            <div>Date: <span>{priceInfo.date}</span></div>
          </div>
        </div>

        <div className="text-center text-black italic opacity-80">
          Click "Draw Trendline" then click and drag on the chart to draw trendlines. Hover over candles to see OHLC data.
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart;