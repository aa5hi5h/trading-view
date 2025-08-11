import { Drawing, DrawingHandle, DrawingOptions } from ".";
import { CordinateSystem } from "../utils/cordinate-system";

export class HorizontalLine extends Drawing{
    public price: number;

constructor(price: number, options: DrawingOptions = {}) {
    super('horizontal', options);
    this.price = price;
  }

  render(ctx: CanvasRenderingContext2D, coordinateSystem: CordinateSystem): void {
    const bounds = coordinateSystem.getChartBounds();
    const y = coordinateSystem.priceToY(this.price);
    
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(bounds.left, y);
    ctx.lineTo(bounds.right, y);
    ctx.stroke();
  }

  hitTest(x: number, y: number, coordinateSystem: CordinateSystem): boolean {
    const lineY = coordinateSystem.priceToY(this.price);
    const bounds = coordinateSystem.getChartBounds();
    return Math.abs(y - lineY) < 5 && x >= bounds.left && x <= bounds.right;
  }

  move(deltaIndex: number, deltaPrice: number): void {
    this.price += deltaPrice;
  }

  getHandles(coordinateSystem: CordinateSystem): DrawingHandle[] {
    const bounds = coordinateSystem.getChartBounds();
    const y = coordinateSystem.priceToY(this.price);
    const handleOffset = 20;
    
    return [
      { x: bounds.left + handleOffset, y, type: 'left' },
      { x: bounds.right - handleOffset, y, type: 'right' }
    ];
  }
}