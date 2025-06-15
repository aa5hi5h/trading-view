"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createChart, ColorType, LineStyle, CandlestickSeries, LineSeries } from 'lightweight-charts';

const LightweightCandlestickChart = () => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  
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

  const trendlinesRef = useRef([]);

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
        time: date.getTime() / 1000, // Convert to Unix timestamp
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100
      });
      
      price = close;
    }
    
    return data;
  }, []);

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: {
          type: ColorType.VerticalGradient,
          topColor: 'rgba(17, 24, 39, 1)',
          bottomColor: 'rgba(30, 58, 138, 0.8)',
        },
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        horzLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.5)',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
    });

    // Add candlestick series
    candlestickSeriesRef.current = chartRef.current.addSeries(CandlestickSeries,{
      upColor: '#00ff88',
      downColor: '#ff4757',
      borderDownColor: '#ff4757',
      borderUpColor: '#00ff88',
      wickDownColor: '#ff4757',
      wickUpColor: '#00ff88',
    });

    // Add line series (initially hidden)
    lineSeriesRef.current = chartRef.current.addSeries(LineSeries,{
      color: '#00d2d3',
      lineWidth: 2,
      visible: false,
    });

    // Set initial data
    const data = generateSampleData();
    candlestickSeriesRef.current.setData(data);
    lineSeriesRef.current.setData(data.map(d => ({ time: d.time, value: d.close })));

    // Subscribe to crosshair move for price info
    chartRef.current.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(candlestickSeriesRef.current);
        if (data) {
          setPriceInfo({
            open: data.open?.toFixed(2) || '-',
            high: data.high?.toFixed(2) || '-',
            low: data.low?.toFixed(2) || '-',
            close: data.close?.toFixed(2) || '-',
            date: new Date(param.time * 1000).toISOString().split('T')[0]
          });
        }
      }
    });

    // Fit content
    chartRef.current.timeScale().fitContent();
  }, [generateSampleData]);

  const handleDrawTrendClick = () => {
    setDrawMode(!drawMode);
  };

  const handleClearAll = () => {
    // Remove all trendlines
    trendlinesRef.current.forEach(line => {
      chartRef.current.removeSeries(line);
    });
    trendlinesRef.current = [];
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
    // Generate new data based on timeframe
    const data = generateSampleData();
    candlestickSeriesRef.current.setData(data);
    lineSeriesRef.current.setData(data.map(d => ({ time: d.time, value: d.close })));
    chartRef.current.timeScale().fitContent();
  };

  const handleCandleStyleChange = (e) => {
    const newStyle = e.target.value;
    setCandleStyle(newStyle);
    
    if (newStyle === 'line') {
      // Show line series, hide candlestick
      candlestickSeriesRef.current.applyOptions({ visible: false });
      lineSeriesRef.current.applyOptions({ visible: true });
    } else {
      // Show candlestick series, hide line
      candlestickSeriesRef.current.applyOptions({ visible: true });
      lineSeriesRef.current.applyOptions({ visible: false });
      
      if (newStyle === 'hollow') {
        // Apply hollow style
        candlestickSeriesRef.current.applyOptions({
          upColor: 'transparent',
          downColor: 'transparent',
          borderDownColor: '#ff4757',
          borderUpColor: '#00ff88',
          wickDownColor: '#ff4757',
          wickUpColor: '#00ff88',
        });
      } else {
        // Apply traditional style
        candlestickSeriesRef.current.applyOptions({
          upColor: '#00ff88',
          downColor: '#ff4757',
          borderDownColor: '#ff4757',
          borderUpColor: '#00ff88',
          wickDownColor: '#ff4757',
          wickUpColor: '#00ff88',
        });
      }
    }
  };

  // Drawing functionality (simplified - using line series for trendlines)
  const handleChartClick = useCallback((param) => {
    if (!drawMode || !param.time || !param.logical) return;
    
    // For simplicity, we'll add a simple line series as a trendline
    // In a real implementation, you'd want more sophisticated drawing tools
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const trendline = lineSeriesRef.current({
      color: color,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
    });
    
    // Add a simple trend line (this is a simplified example)
    const data = candlestickSeriesRef.current.data();
    if (data.length > 10) {
      const startIndex = Math.max(0, data.length - 20);
      const endIndex = data.length - 1;
      const trendData = [
        { time: data[startIndex].time, value: data[startIndex].close },
        { time: data[endIndex].time, value: data[endIndex].close }
      ];
      trendline.setData(trendData);
      trendlinesRef.current.push(trendline);
    }
  }, [drawMode]);

  // Initialize chart on mount
  useEffect(() => {
    initializeChart();
    
    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [initializeChart]);

  // Add click handler for drawing
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.subscribeClick(handleChartClick);
    }
    
    return () => {
      if (chartRef.current) {
        chartRef.current.unsubscribeClick(handleChartClick);
      }
    };
  }, [handleChartClick]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-5">
      <div className="max-w-6xl mx-auto bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
        <h1 className="text-center text-4xl font-bold mb-8 drop-shadow-lg">
          Lightweight Charts - Interactive Candlestick Chart
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
          
          <div className="flex items-center gap-3 bg-white bg-opacity-10 px-4 py-2 rounded-full backdrop-blur-sm">
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

        <div className="bg-black bg-opacity-20 rounded-2xl p-5 mb-5 relative shadow-inner">
          <div
            ref={chartContainerRef}
            className={`w-full h-[600px] rounded-xl ${
              drawMode ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
          
          <div className="absolute top-8 right-8 bg-black bg-opacity-80 p-4 rounded-xl font-mono text-sm border border-white border-opacity-20 backdrop-blur-lg">
            <div>O: <span className="text-green-400">{priceInfo.open}</span></div>
            <div>H: <span className="text-green-400">{priceInfo.high}</span></div>
            <div>L: <span className="text-red-400">{priceInfo.low}</span></div>
            <div>C: <span className="text-blue-400">{priceInfo.close}</span></div>
            <div>Date: <span className="text-gray-300">{priceInfo.date}</span></div>
          </div>
        </div>

        <div className="text-center italic opacity-80">
          Move your cursor over the chart to see OHLC data. Click "Drawing Mode" then click on the chart to add trendlines.
        </div>
      </div>
    </div>
  );
};

export default LightweightCandlestickChart;