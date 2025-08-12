
import { Candle } from "../data/sample-data";
import { CordinateSystem } from "../utils/cordinate-system";

export class CrosshairRenderer {
  private coordinateSystem: CordinateSystem;
  private mousePosition: { x: number; y: number } | null = null;

  constructor(coordinateSystem: CordinateSystem) {
    this.coordinateSystem = coordinateSystem;
  }

  setMousePosition(x: number, y: number): void {
    if (this.coordinateSystem.isInChartArea(x, y)) {
      this.mousePosition = { x, y };
    } else {
      this.mousePosition = null;
    }
  }

  render(ctx: CanvasRenderingContext2D, data: Candle[]): void {
    if (!this.mousePosition) return;

    const bounds = this.coordinateSystem.getChartBounds();
    const { x, y } = this.mousePosition;

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, bounds.top);
    ctx.lineTo(x, bounds.bottom);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(bounds.left, y);
    ctx.lineTo(bounds.right, y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Price label
    const price = this.coordinateSystem.yToPrice(y);
    ctx.fillStyle = '#374151';
    ctx.fillRect(bounds.right + 2, y - 10, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(price.toFixed(2), bounds.right + 32, y + 4);

    // Index/Date label
    const index = Math.round(this.coordinateSystem.xToIndex(x));
    if (index >= 0 && index < data.length) {
      const dateStr = data[index].date.slice(5);
      ctx.fillStyle = '#374151';
      ctx.fillRect(x - 30, bounds.bottom + 2, 60, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dateStr, x, bounds.bottom + 16);
    }
  }

  clear(): void {
    this.mousePosition = null;
  }
}