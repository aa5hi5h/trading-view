import { Drawing } from "../drawings";
import { HorizontalLine } from "../drawings/horizontal-line";
import { DrawingManager } from "../drawings/main";
import { TextAnnotation } from "../drawings/text-annotation";
import { TrendLine } from "../drawings/trendline";
import { CordinateSystem } from "../utils/cordinate-system";
import { InteractionHandler } from "./main";

export class DrawingHandler implements InteractionHandler {
  private drawingManager: DrawingManager;
  private isDrawing: boolean = false;
  private currentDrawing: Drawing | null = null;
  private drawingMode: 'none' | 'trendline' | 'horizontal' | 'text' = 'none';

  constructor(drawingManager: DrawingManager) {
    this.drawingManager = drawingManager;
  }

  setDrawingMode(mode: 'none' | 'trendline' | 'horizontal' | 'text'): void {
    this.drawingMode = mode;
    this.isDrawing = false;
    this.currentDrawing = null;
  }

  handleMouseDown(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    if (this.drawingMode === 'none' || !coordinateSystem.isInChartArea(event.offsetX, event.offsetY)) {
      return false;
    }

    const index = coordinateSystem.xToIndex(event.offsetX);
    const price = coordinateSystem.yToPrice(event.offsetY);

    switch (this.drawingMode) {
      case 'trendline':
        if (!this.isDrawing) {
          this.currentDrawing = new TrendLine(index, price, index, price);
          this.isDrawing = true;
        } else {
          if (this.currentDrawing instanceof TrendLine) {
            this.currentDrawing.endIndex = index;
            this.currentDrawing.endPrice = price;
            this.drawingManager.addDrawing(this.currentDrawing);
            this.isDrawing = false;
            this.currentDrawing = null;
          }
        }
        return true;

      case 'horizontal':
        const horizontalLine = new HorizontalLine(price);
        this.drawingManager.addDrawing(horizontalLine);
        return true;

      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          const textAnnotation = new TextAnnotation(index, price, text);
          this.drawingManager.addDrawing(textAnnotation);
        }
        return true;
    }

    return false;
  }

  handleMouseMove(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    if (this.isDrawing && this.currentDrawing instanceof TrendLine) {
      const index = coordinateSystem.xToIndex(event.offsetX);
      const price = coordinateSystem.yToPrice(event.offsetY);
      this.currentDrawing.endIndex = index;
      this.currentDrawing.endPrice = price;
      return true;
    }
    return false;
  }

  handleMouseUp(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    return false; 
  }

  handleWheel(event: WheelEvent, coordinateSystem: CordinateSystem): boolean {
    return false; 
  }

  getCurrentDrawing(): Drawing | null {
    return this.currentDrawing;
  }

  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }
}
