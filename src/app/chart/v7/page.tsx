"use client"
import { ChartEngine, ChartEngineOptions } from '@/chart-engine/core/chart-engine';
import { Candle, SampleData } from '@/chart-engine/data/sample-data';
import { DrawingMode } from '@/chart-engine/drawings/main';
import React, { useEffect, useRef, useState } from 'react';

// Chart V7 Component using our custom chart engine
const ChartV7: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartEngineRef = useRef<ChartEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrawingMode, setActiveDrawingMode] = useState<DrawingMode>('select');
  const [isDrawing, setIsDrawing] = useState(false);

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
        console.log('Generated sample data:', sampleData.slice(0, 5));

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

        // Set up drawing manager event listeners
        const drawingManager = chartEngine.getDrawingManager();
        if (drawingManager) {
          // Listen for drawing state changes
          drawingManager.on('redrawRequested', () => {
            setIsDrawing(drawingManager.isDrawingActive());
          });
          
          drawingManager.on('drawingModeChanged', (mode) => {
            setActiveDrawingMode(mode);
          });

          drawingManager.on('drawingStarted', (type) => {
            setIsDrawing(true);
          });

          drawingManager.on('drawingFinished', () => {
            setIsDrawing(false);
          });

          // Handle text input requests
          drawingManager.on('textInputRequested', ({ index, price }) => {
            const text = prompt('Enter text annotation:');
            if (text) {
              drawingManager.addTextAnnotation(index, price, text, {
                color: '#ffffff',
                fontSize: 12
              });
            }
          });
          
          // Set initial mode
          setActiveDrawingMode(drawingManager.getDrawingMode());
        }

        // Set up other event listeners
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

  const setDrawingMode = (mode: DrawingMode) => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      drawingManager.setDrawingMode(mode);
      setActiveDrawingMode(mode);
    }
  };

  const clearDrawings = () => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      drawingManager.clear();
    }
  };

  const removeSelectedDrawing = () => {
    const drawingManager = chartEngineRef.current?.getDrawingManager();
    if (drawingManager) {
      drawingManager.removeSelectedDrawing();
    }
  };

  const getButtonClass = (mode: DrawingMode) => {
    const baseClass = "px-3 py-1 text-white text-sm rounded transition-colors";
    const isActive = activeDrawingMode === mode;
    
    switch (mode) {
      case 'select':
        return `${baseClass} ${isActive ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`;
      case 'trendline':
        return `${baseClass} ${isActive ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'}`;
      case 'horizontal':
        return `${baseClass} ${isActive ? 'bg-yellow-700' : 'bg-yellow-600 hover:bg-yellow-700'}`;
      case 'text':
        return `${baseClass} ${isActive ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`;
      default:
        return `${baseClass} bg-gray-600 hover:bg-gray-700`;
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
    <div className="w-full h-full min-h-[500px] bg-gray-900  overflow-hidden">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold">
          Custom Chart Engine V7 - Interactive Drawing
        </h2>
        <div className="flex gap-2">
          {/* Drawing Mode Buttons */}
          <button
            onClick={() => setDrawingMode('select')}
            className={getButtonClass('select')}
            disabled={isLoading}
            title="Select and move drawings"
          >
            Select
          </button>
          <button
            onClick={() => setDrawingMode('trendline')}
            className={getButtonClass('trendline')}
            disabled={isLoading}
            title="Click to start, move mouse, click to finish"
          >
            {isDrawing && activeDrawingMode === 'trendline' ? 'Drawing...' : 'Trend Line'}
          </button>
          <button
            onClick={() => setDrawingMode('horizontal')}
            className={getButtonClass('horizontal')}
            disabled={isLoading}
            title="Click to place horizontal line"
          >
            Horizontal Line
          </button>
          <button
            onClick={() => setDrawingMode('text')}
            className={getButtonClass('text')}
            disabled={isLoading}
            title="Click to add text annotation"
          >
            Text
          </button>
          
          {/* Action Buttons */}
          <div className="border-l border-gray-600 pl-2 ml-2">
            <button
              onClick={removeSelectedDrawing}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors mr-2"
              disabled={isLoading}
              title="Delete selected drawing"
            >
              Delete Selected
            </button>
            <button
              onClick={clearDrawings}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              disabled={isLoading}
              title="Clear all drawings"
            >
              Clear All
            </button>
          </div>
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
          className="w-full h-full"
          style={{ 
            display: isLoading ? 'none' : 'block',
            backgroundColor: '#1f2937',
            cursor: activeDrawingMode === 'select' ? 'default' : 'crosshair'
          }}
        />
      </div>

      {/* Chart Info */}
      <div className="p-2 bg-gray-800 text-gray-300 text-xs flex justify-between">
        <div className="flex items-center gap-4">
          <span>🖱️ Mouse wheel to zoom • Click and drag to pan</span>
          {activeDrawingMode !== 'select' && (
            <span className="text-yellow-300">
              {activeDrawingMode === 'trendline' ? 
                (isDrawing ? '📍 Click to finish trend line' : '📍 Click to start trend line') :
              activeDrawingMode === 'horizontal' ? 
                '📍 Click to place horizontal line' :
              activeDrawingMode === 'text' ?
                '📍 Click to add text annotation' :
                ''
              }
            </span>
          )}
        </div>
        <span>📊 Candlestick Chart with SMA(20, 50)</span>
      </div>
    </div>
  );
};

export default ChartV7;