"use client"
import { ChartEngine, ChartEngineOptions } from '@/chart-engine/core/chart-engine';
import { Candle, SampleData } from '@/chart-engine/data/sample-data';
import React, { useEffect, useRef, useState } from 'react';

// Chart V7 Component using our custom chart engine
const ChartV7: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartEngineRef = useRef<ChartEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeChart = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas element not found');
        }

        // Set canvas size
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || 400;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // Generate sample data
        const sampleData: Candle[] = SampleData.generate(200, 100);
        console.log('Generated sample data:', sampleData.slice(0, 5)); // Log first 5 items

        // Chart engine options
        const options: ChartEngineOptions = {
          width: containerWidth,
          height: containerHeight,
          padding: { x: 80, y: 50 },
          backgroundColor: '#1f2937'
        };

        // Create and initialize chart engine
        const chartEngine = new ChartEngine(canvas, options);
        chartEngineRef.current = chartEngine;

        // Set the data
        chartEngine.setData(sampleData);

        // Add some indicators
        chartEngine.addIndicator('sma', 20, '#3b82f6');
        chartEngine.addIndicator('sma', 50, '#ef4444');

        // Set up event listeners
        chartEngine.on('dataChanged', (data: Candle[]) => {
          console.log('Data changed:', data.length, 'candles');
        });

        chartEngine.on('viewportChanged', (state) => {
          console.log('Viewport changed:', state);
        });

        setIsLoading(false);
        console.log('Chart initialized successfully');

      } catch (err) {
        console.error('Failed to initialize chart:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    initializeChart();

    // Cleanup
    return () => {
      if (chartEngineRef.current) {
        chartEngineRef.current.destroy();
        chartEngineRef.current = null;
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const chartEngine = chartEngineRef.current;
      
      if (canvas && chartEngine) {
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || 400;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        chartEngine.resize(containerWidth, containerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addTrendLine = () => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      const trendLine = drawingManager.createTrendLine(10, 95, 50, 105, {
        color: '#10b981',
        lineWidth: 2
      });
      drawingManager.addDrawing(trendLine);
    }
  };

  const addHorizontalLine = () => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      const horizontalLine = drawingManager.createHorizontalLine(100, {
        color: '#f59e0b',
        lineWidth: 2
      });
      drawingManager.addDrawing(horizontalLine);
    }
  };

  const clearDrawings = () => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      drawingManager.clear();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 text-red-400 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Chart Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] bg-gray-900 rounded-lg overflow-hidden">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold">
          Custom Chart Engine V7
        </h2>
        <div className="flex gap-2">
          <button
            onClick={addTrendLine}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            disabled={isLoading}
          >
            Add Trend Line
          </button>
          <button
            onClick={addHorizontalLine}
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            disabled={isLoading}
          >
            Add Horizontal Line
          </button>
          <button
            onClick={clearDrawings}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            Clear Drawings
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full h-[calc(100%-60px)]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
              <p>Initializing Chart...</p>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ 
            display: isLoading ? 'none' : 'block',
            backgroundColor: '#1f2937'
          }}
        />
      </div>

      {/* Chart Info */}
      <div className="p-2 bg-gray-800 text-gray-300 text-xs flex justify-between">
        <span>🖱️ Mouse wheel to zoom • Click and drag to pan</span>
        <span>📊 Candlestick Chart with SMA(20, 50)</span>
      </div>
    </div>
  );
};

export default ChartV7;