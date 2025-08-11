import { Drawing, DrawingHandle, DrawingOptions } from ".";
import { CordinateSystem } from "../utils/cordinate-system";

export class TextAnnotation extends Drawing {
  public index: number;
  public price: number;
  public text: string;
  public fontSize: number;

  constructor(index: number, price: number, text: string, options: DrawingOptions = {}) {
    super('text', options);
    this.index = index;
    this.price = price;
    this.text = text;
    this.fontSize = options.fontSize || 14;
  }

  render(ctx: CanvasRenderingContext2D, coordinateSystem: CordinateSystem): void {
    const x = coordinateSystem.indexToX(this.index);
    const y = coordinateSystem.priceToY(this.price);
    
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(this.text, x, y);
  }

  hitTest(x: number, y: number, coordinateSystem: CordinateSystem): boolean {
    const textX = coordinateSystem.indexToX(this.index);
    const textY = coordinateSystem.priceToY(this.price);
    
    return x >= textX - 5 && x <= textX + 100 && 
           y >= textY - 15 && y <= textY + 5;
  }

  move(deltaIndex: number, deltaPrice: number): void {
    this.index += deltaIndex;
    this.price += deltaPrice;
  }

  getHandles(coordinateSystem: CordinateSystem): DrawingHandle[] {
    return [{
      x: coordinateSystem.indexToX(this.index),
      y: coordinateSystem.priceToY(this.price),
      type: 'position'
    }];
  }
}