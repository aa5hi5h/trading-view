import { Drawing, DrawingOptions } from ".";
import { CordinateSystem } from "../utils/cordinate-system";
import { EventEmitter } from "../utils/event-emitter";
import { HorizontalLine } from "./horizontal-line";
import { TextAnnotation } from "./text-annotation";
import { TrendLine } from "./trendline";

export type DrawingMode = 'none' | 'trendline' | 'horizontal' | 'text' | 'select';

export interface DrawingState {
  isDrawing: boolean;
  drawingMode: DrawingMode;
  startPoint?: { x: number; y: number };
  previewDrawing?: Drawing;
}

export class DrawingManager extends EventEmitter {
  private drawings: Drawing[] = [];
  private selectedDrawing: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private coordinateSystem: CordinateSystem | null = null;
  
  // Interactive drawing state
  private state: DrawingState = {
    isDrawing: false,
    drawingMode: 'none'
  };
  
  // Mouse interaction state
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private isMouseListenersAttached = false;

  constructor() {
    super();
  }

  // Initialize with canvas and coordinate system for interactive features
  public initialize(canvas: HTMLCanvasElement, coordinateSystem: CordinateSystem): void {
    this.canvas = canvas;
    this.coordinateSystem = coordinateSystem;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas || this.isMouseListenersAttached) return;

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.isMouseListenersAttached = true;
  }

  private removeEventListeners(): void {
    if (!this.canvas || !this.isMouseListenersAttached) return;

    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.isMouseListenersAttached = false;
  }

  private getMousePosition(event: MouseEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.coordinateSystem) return;
    
    const mousePos = this.getMousePosition(event);
    
    if (this.state.drawingMode === 'select') {
      // Check if we clicked on an existing drawing
      const clickedIndex = this.hitTest(mousePos.x, mousePos.y, this.coordinateSystem);
      if (clickedIndex >= 0) {
        this.selectDrawing(clickedIndex);
        this.isDragging = true;
        this.dragOffset = mousePos;
      } else {
        this.selectDrawing(-1); // Deselect
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.coordinateSystem) return;
    
    const mousePos = this.getMousePosition(event);

    if (this.isDragging && this.selectedDrawing !== null && this.state.drawingMode === 'select') {
      // Handle dragging existing drawings
      const deltaX = mousePos.x - this.dragOffset.x;
      const deltaY = mousePos.y - this.dragOffset.y;
      
      const deltaIndex = this.coordinateSystem.xToIndex(this.dragOffset.x + deltaX) - 
                        this.coordinateSystem.xToIndex(this.dragOffset.x);
      const deltaPrice = this.coordinateSystem.yToPrice(this.dragOffset.y) - 
                        this.coordinateSystem.yToPrice(this.dragOffset.y + deltaY);
      
      const selectedDrawing = this.drawings[this.selectedDrawing];
      if (selectedDrawing) {
        selectedDrawing.move(deltaIndex, deltaPrice);
        this.dragOffset = mousePos;
        this.emit('drawingMoved', this.selectedDrawing);
        this.emit('redrawRequested');
      }
    } else if (this.state.isDrawing && this.state.startPoint) {
      // Handle drawing preview
      this.updatePreviewDrawing(mousePos);
      this.emit('redrawRequested');
    }

    // Update cursor
    this.updateCursor(mousePos);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.isDragging = false;
  }

  private handleClick(event: MouseEvent): void {
    if (!this.coordinateSystem) return;
    
    const mousePos = this.getMousePosition(event);

    switch (this.state.drawingMode) {
      case 'trendline':
        this.handleTrendLineDrawing(mousePos);
        break;
      case 'horizontal':
        this.handleHorizontalLineDrawing(mousePos);
        break;
      case 'text':
        this.handleTextDrawing(mousePos);
        break;
    }
  }

  private handleTrendLineDrawing(mousePos: { x: number; y: number }): void {
    if (!this.coordinateSystem) return;

    if (!this.state.isDrawing) {
      // Start drawing
      this.state.isDrawing = true;
      this.state.startPoint = mousePos;
      this.emit('drawingStarted', 'trendline');
    } else {
      // Finish drawing
      if (this.state.startPoint) {
        const startIndex = this.coordinateSystem.xToIndex(this.state.startPoint.x);
        const startPrice = this.coordinateSystem.yToPrice(this.state.startPoint.y);
        const endIndex = this.coordinateSystem.xToIndex(mousePos.x);
        const endPrice = this.coordinateSystem.yToPrice(mousePos.y);

        const trendLine = this.createTrendLine(startIndex, startPrice, endIndex, endPrice, {
          color: '#10b981',
          lineWidth: 2
        });

        this.addDrawing(trendLine);
        this.finishDrawing();
      }
    }
  }

  private handleHorizontalLineDrawing(mousePos: { x: number; y: number }): void {
    if (!this.coordinateSystem) return;

    const price = this.coordinateSystem.yToPrice(mousePos.y);
    const horizontalLine = this.createHorizontalLine(price, {
      color: '#f59e0b',
      lineWidth: 2
    });

    this.addDrawing(horizontalLine);
    this.setDrawingMode('select'); // Auto switch to select mode
  }

  private handleTextDrawing(mousePos: { x: number; y: number }): void {
    if (!this.coordinateSystem) return;

    const index = this.coordinateSystem.xToIndex(mousePos.x);
    const price = this.coordinateSystem.yToPrice(mousePos.y);
    
    // Emit event to request text input from UI
    this.emit('textInputRequested', { index, price, mousePos });
  }

  private updatePreviewDrawing(mousePos: { x: number; y: number }): void {
    if (!this.state.startPoint || !this.coordinateSystem) return;

    switch (this.state.drawingMode) {
      case 'trendline':
        const startIndex = this.coordinateSystem.xToIndex(this.state.startPoint.x);
        const startPrice = this.coordinateSystem.yToPrice(this.state.startPoint.y);
        const endIndex = this.coordinateSystem.xToIndex(mousePos.x);
        const endPrice = this.coordinateSystem.yToPrice(mousePos.y);

        this.state.previewDrawing = this.createTrendLine(startIndex, startPrice, endIndex, endPrice, {
          color: '#10b981',
          lineWidth: 1,
          alpha: 0.6
        });
        break;
    }
  }

  private updateCursor(mousePos: { x: number; y: number }): void {
    if (!this.canvas || !this.coordinateSystem) return;
    
    let cursor = 'default';

    switch (this.state.drawingMode) {
      case 'trendline':
      case 'horizontal':
      case 'text':
        cursor = 'crosshair';
        break;
      case 'select':
        const hoveredIndex = this.hitTest(mousePos.x, mousePos.y, this.coordinateSystem);
        cursor = hoveredIndex >= 0 ? 'move' : 'default';
        break;
    }

    this.canvas.style.cursor = cursor;
  }

  private finishDrawing(): void {
    this.state.isDrawing = false;
    this.state.startPoint = undefined;
    this.state.previewDrawing = undefined;
    this.setDrawingMode('select'); // Switch back to select mode
    this.emit('drawingFinished');
  }

  // Public methods for drawing mode management
  public setDrawingMode(mode: DrawingMode): void {
    // Cancel any ongoing drawing when switching modes
    if (this.state.isDrawing) {
      this.finishDrawing();
    }
    
    this.state.drawingMode = mode;
    this.selectDrawing(-1); // Deselect any selected drawing
    
    // Update cursor
    if (this.canvas) {
      this.canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
    }
    
    this.emit('drawingModeChanged', mode);
  }

  public getDrawingMode(): DrawingMode {
    return this.state.drawingMode;
  }

  public isDrawingActive(): boolean {
    return this.state.isDrawing;
  }

  // Add text annotation with user input
  public addTextAnnotation(index: number, price: number, text: string, options?: DrawingOptions): void {
    const textAnnotation = this.createTextAnnotation(index, price, text, options);
    this.addDrawing(textAnnotation);
    this.setDrawingMode('select');
  }

  // Existing methods (preserved)
  addDrawing(drawing: Drawing): void {
    this.drawings.push(drawing);
    this.emit("drawingAdded", drawing);
    this.emit("drawingsChanged", this.drawings);
  }

  removeDrawing(index: number): void {
    if (index >= 0 && index < this.drawings.length) {
      const removed = this.drawings.splice(index, 1)[0];
      if (this.selectedDrawing === index) {
        this.selectedDrawing = null;
      } else if (this.selectedDrawing !== null && this.selectedDrawing > index) {
        this.selectedDrawing--;
      }
      this.emit('drawingRemoved', removed);
      this.emit('drawingsChanged', this.drawings);
    }
  }

  removeSelectedDrawing(): void {
    if (this.selectedDrawing !== null) {
      this.removeDrawing(this.selectedDrawing);
    }
  }

  selectDrawing(index: number): void {
    if (index >= 0 && index < this.drawings.length) {
      this.selectedDrawing = index;
      this.emit('drawingSelected', index);
    } else {
      this.selectedDrawing = null;
      this.emit('drawingDeselected');
    }
  }

  getDrawing(index: number): Drawing | undefined {
    return this.drawings[index];
  }

  getSelectedDrawing(): Drawing | null {
    return this.selectedDrawing !== null ? this.drawings[this.selectedDrawing] : null;
  }

  hitTest(x: number, y: number, coordinateSystem: CordinateSystem): number {
    for (let i = this.drawings.length - 1; i >= 0; i--) {
      if (this.drawings[i].hitTest(x, y, coordinateSystem)) {
        return i;
      }
    }
    return -1;
  }

  render(ctx: CanvasRenderingContext2D, coordinateSystem: CordinateSystem): void {
    // Render all drawings
    this.drawings.forEach((drawing, index) => {
      drawing.render(ctx, coordinateSystem);
      
      // Draw selection handles
      if (this.selectedDrawing === index) {
        this.renderSelectionHandles(ctx, drawing, coordinateSystem);
      }
    });

    // Render preview drawing if we're currently drawing
    if (this.state.previewDrawing) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      this.state.previewDrawing.render(ctx, coordinateSystem);
      ctx.restore();
    }
  }

  private renderSelectionHandles(ctx: CanvasRenderingContext2D, drawing: Drawing, coordinateSystem: CordinateSystem): void {
    const handles = drawing.getHandles(coordinateSystem);
    
    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    handles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }

  createTrendLine(startIndex: number, startPrice: number, endIndex: number, endPrice: number, options?: DrawingOptions): TrendLine {
    return new TrendLine(startIndex, startPrice, endIndex, endPrice, options);
  }

  createHorizontalLine(price: number, options?: DrawingOptions): HorizontalLine {
    return new HorizontalLine(price, options);
  }

  createTextAnnotation(index: number, price: number, text: string, options?: DrawingOptions): TextAnnotation {
    return new TextAnnotation(index, price, text, options);
  }

  clear(): void {
    this.drawings = [];
    this.selectedDrawing = null;
    this.state.isDrawing = false;
    this.state.startPoint = undefined;
    this.state.previewDrawing = undefined;
    this.emit('drawingsChanged', this.drawings);
  }

  getDrawings(): Drawing[] {
    return [...this.drawings];
  }

  getSelectedIndex(): number | null {
    return this.selectedDrawing;
  }

  // Cleanup method
  destroy(): void {
    this.removeEventListeners();
    this.clear();
    this.canvas = null;
    this.coordinateSystem = null;
  }
}