import { Drawing, DrawingHandle, DrawingOptions } from ".";
import { CordinateSystem } from "../utils/cordinate-system";

export class TrendLine extends Drawing {
  public startIndex: number;
  public startPrice: number;
  public endIndex: number;
  public endPrice: number;

  constructor(startIndex: number, startPrice: number, endIndex: number, endPrice: number, options: DrawingOptions = {}) {
    super('trendline', options);
    this.startIndex = startIndex;
    this.startPrice = startPrice;
    this.endIndex = endIndex;
    this.endPrice = endPrice;
  }

  render(ctx: CanvasRenderingContext2D, coordinateSystem: CordinateSystem): void {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(
      coordinateSystem.indexToX(this.startIndex),
      coordinateSystem.priceToY(this.startPrice)
    );
    ctx.lineTo(
      coordinateSystem.indexToX(this.endIndex),
      coordinateSystem.priceToY(this.endPrice)
    );
    ctx.stroke();
  }

  hitTest(x: number, y: number, coordinateSystem: CordinateSystem): boolean {
    const startX = coordinateSystem.indexToX(this.startIndex);
    const startY = coordinateSystem.priceToY(this.startPrice);
    const endX = coordinateSystem.indexToX(this.endIndex);
    const endY = coordinateSystem.priceToY(this.endPrice);
    
    const distance = Math.abs(
      (endY - startY) * x - (endX - startX) * y + endX * startY - endY * startX
    ) / Math.sqrt(Math.pow(endY - startY, 2) + Math.pow(endX - startX, 2));
    
    return distance < 5;
  }

  move(deltaIndex: number, deltaPrice: number): void {
    this.startIndex += deltaIndex;
    this.endIndex += deltaIndex;
    this.startPrice += deltaPrice;
    this.endPrice += deltaPrice;
  }

  getHandles(coordinateSystem: CordinateSystem): DrawingHandle[] {
    return [
      {
        x: coordinateSystem.indexToX(this.startIndex),
        y: coordinateSystem.priceToY(this.startPrice),
        type: 'start'
      },
      {
        x: coordinateSystem.indexToX(this.endIndex),
        y: coordinateSystem.priceToY(this.endPrice),
        type: 'end'
      }
    ];
  }
}