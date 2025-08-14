
import { DataProvider } from "../data/data-provider";
import { EventEmitter } from "../utils/event-emitter";
import { ChartDimensionsProps, CordinateSystem, PaddingProps } from "../utils/cordinate-system";
import { DrawingManager } from "../drawings/main";
import { InteractionManager } from "../interactions/main";
import { CandleStickRenderer } from "../renders/candlestick";
import { GridRenderer } from "../renders/grid";
import { CrosshairRenderer } from "../renders/crosshair";
import { IndicatorRender } from "../renders/indicator";
import { CandlestickData } from "lightweight-charts";
import { PanHandler } from "../interactions/pan-handler";
import { ZoomHandler } from "../interactions/zoom-handler";
import { DrawingHandler } from "../interactions";
import { SMA } from "../indicator/sma";
import { EMA } from "../indicator/ema";
import { BollingerBands } from "../indicator/bollinger-band";
import { Viewport, ViewportState } from "./viewport";
import { Candle } from "../data/sample-data";
import { Drawing } from "../drawings";

export interface ChartEngineOptions {
  width?: number;
  height?: number;
  padding?: PaddingProps;
  backgroundColor?: string;
}

export class ChartEngine extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dataProvider: DataProvider;
  private viewport: Viewport;
  private coordinateSystem: CordinateSystem;
  private drawingManager: DrawingManager;
  private interactionManager: InteractionManager;
  
  private candlestickRenderer: CandleStickRenderer;
  private gridRenderer: GridRenderer;
  private indicatorRenderer: IndicatorRender;
private crosshairRenderer: CrosshairRenderer;

  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, options: ChartEngineOptions = {}) {
    super();
    
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to get 2D rendering context');
    }
    this.ctx = context;

    this.dataProvider = new DataProvider();
    this.viewport = new Viewport(0);
    
    const chartDimensions: ChartDimensionsProps = {
      width: options.width || canvas.width,
      height: options.height || canvas.height
    };
    
    const padding = options.padding || { x: 60, y: 40 };
    
    this.coordinateSystem = new CordinateSystem(
      chartDimensions,
      { min: 0, max: 100 },
      { start: 0, end: 10 },
      padding
    );

    this.drawingManager = new DrawingManager();
    this.drawingManager.initialize(canvas, this.coordinateSystem);
    this.interactionManager = new InteractionManager(canvas, this.coordinateSystem);

    // Initialize renderers
    this.candlestickRenderer = new CandleStickRenderer(this.coordinateSystem);
    this.gridRenderer = new GridRenderer(this.coordinateSystem);
    this.indicatorRenderer = new IndicatorRender(this.coordinateSystem);
    this.crosshairRenderer = new CrosshairRenderer(this.coordinateSystem);

    this.drawingManager.on('redrawRequested', () => {
      this.render();
    });

    this.drawingManager.on('drawingAdded', () => {
      this.render();
    });

    this.drawingManager.on('drawingRemoved', () => {
      this.render();
    });

    this.drawingManager.on('drawingMoved', () => {
      this.render();
    });

    // Setup event listeners
    this.setupEventListeners();
    
    // Setup interaction handlers
    this.setupInteractionHandlers();

    // Set canvas background
    if (options.backgroundColor) {
      this.canvas.style.backgroundColor = options.backgroundColor;
    }

    // Start render loop
    this.startRenderLoop();
  }

  private setupEventListeners(): void {
    this.dataProvider.on('dataChanged', (data: Candle[]) => {
      this.viewport.setDataLength(data.length);
      this.updatePriceRange();
      this.emit('dataChanged', data);
    });

    this.viewport.on('viewportChanged', (state: ViewportState) => {
      this.coordinateSystem.updateViewWindow(state.viewWindow);
      this.coordinateSystem.updatePriceRange(state.priceRange);
      this.emit('viewportChanged', state);
    });

    this.canvas.addEventListener('mousemove', (event) => {
      this.crosshairRenderer.setMousePosition(event.offsetX, event.offsetY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.crosshairRenderer.clear();
    });
  }

  private setupInteractionHandlers(): void {
    const panHandler = new PanHandler(this.viewport);
    const zoomHandler = new ZoomHandler(this.viewport);
    const drawingHandler = new DrawingHandler(this.drawingManager);

    this.interactionManager.addHandler(panHandler);
    this.interactionManager.addHandler(zoomHandler);
    this.interactionManager.addHandler(drawingHandler);
  }

  private updatePriceRange(): void {
    const data = this.dataProvider.getData();
    const state = this.viewport.getState();
    const priceRange = this.dataProvider.calculatePriceRange(
      state.viewWindow.start,
      state.viewWindow.end
    );
    this.viewport.setPriceRange(priceRange.min, priceRange.max);
  }

  private startRenderLoop(): void {
    const render = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private render(): void {
    const data = this.dataProvider.getData();
    if (data.length === 0) return;

    const state = this.viewport.getState();
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.gridRenderer.render(this.ctx, data, state.priceRange, state.viewWindow);
    
    this.candlestickRenderer.render(this.ctx, data, state.viewWindow);
    
    this.drawingManager.render(this.ctx, this.coordinateSystem);
    
    this.crosshairRenderer.render(this.ctx, data);
  }

  // Public API methods
  setData(data: Candle[]): void {
    this.dataProvider.setData(data);
  }

  getData(): Candle[] {
    return this.dataProvider.getData();
  }

  addIndicator(type: 'sma' | 'ema' | 'bollinger', period: number, color?: string): void {
    const data = this.dataProvider.getData();
    
    switch (type) {
      case 'sma':
        const smaValues = SMA.calculate(data, period);
        break;
      case 'ema':
        const emaValues = EMA.calculate(data, period);
        break;
      case 'bollinger':
        const bollingerBands = BollingerBands.calculate(data, period);
        break;
    }
  }

  getDrawingManager(): DrawingManager {
    return this.drawingManager;
  }

  getViewport(): Viewport {
    return this.viewport;
  }

  getCoordinateSystem(): CordinateSystem {
    return this.coordinateSystem;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.coordinateSystem.updateDimensions({ width, height });
    this.emit('resized', { width, height });
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.interactionManager.destroy();
    this.emit('destroyed');
  }
  public addDrawing(drawing: Drawing): void {
    this.drawingManager.addDrawing(drawing);
  }

  public createTrendLine(startIndex: number, startPrice: number, endIndex: number, endPrice: number, options = {}) {
    return this.drawingManager.createTrendLine(startIndex, startPrice, endIndex, endPrice, options);
  }

  public createHorizontalLine(price: number, options = {}) {
    return this.drawingManager.createHorizontalLine(price, options);
  }
}