import { Drawing, DrawingOptions } from ".";
import { CordinateSystem } from "../utils/cordinate-system";
import { EventEmitter } from "../utils/event-emitter";
import { HorizontalLine } from "./horizontal-line";
import { TextAnnotation } from "./text-annotation";
import { TrendLine } from "./trendline";

export class DrawingManager extends EventEmitter {
    private drawings: Drawing[] = [];
    private selectedDrawing : number | null = null;

    constructor(){
        super()
    }

    addDrawing(drawing: Drawing): void{
        this.drawings.push(drawing)
        this.emit("Drawing Addedd",drawing)
        this.emit("DrawingRemoved",this.drawings)
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
    this.drawings.forEach((drawing, index) => {
      drawing.render(ctx, coordinateSystem);
      
      // Draw selection handles
      if (this.selectedDrawing === index) {
        this.renderSelectionHandles(ctx, drawing, coordinateSystem);
      }
    });
  }

  private renderSelectionHandles(ctx: CanvasRenderingContext2D, drawing: Drawing, coordinateSystem: CordinateSystem): void {
    const handles = drawing.getHandles(coordinateSystem);
    ctx.fillStyle = '#3b82f6';
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - 3, handle.y - 3, 6, 6);
    });
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
    this.emit('drawingsChanged', this.drawings);
  }

  getDrawings(): Drawing[] {
    return [...this.drawings];
  }

  getSelectedIndex(): number | null {
    return this.selectedDrawing;
  }
}
