import { Candle } from "../data/sample-data";
import { CordinateSystem, PriceRangeProps, ViewWindowProps } from "../utils/cordinate-system";


export class GridRenderer{

    public cordinateSystem: CordinateSystem 

    constructor(cordinateSystem: CordinateSystem){
        this.cordinateSystem = cordinateSystem
    }

    render(
        ctx: CanvasRenderingContext2D,
        data: Candle[],
        priceRange: PriceRangeProps,
        viewWindow: ViewWindowProps
    ): void{
        const {width,height} = this.cordinateSystem.chartDimensions
        const {x:paddingX, y: paddingY} = this.cordinateSystem.padding

        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 1

    const numHorizontalLines = 10;
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = paddingY + (i * (height - 2 * paddingY)) / numHorizontalLines;
      ctx.beginPath();
      ctx.moveTo(paddingX, y);
      ctx.lineTo(width - paddingX, y);
      ctx.stroke();

      const price = priceRange.max - (i * (priceRange.max - priceRange.min)) / numHorizontalLines;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), paddingX - 5, y + 4);
    }

    const visibleDataCount = viewWindow.end - viewWindow.start;
    const step = Math.max(1, Math.floor(visibleDataCount / 10));
    
    for (let i = 0; i < visibleDataCount; i += step) {
      const fullDataIndex = viewWindow.start + i;
      if (fullDataIndex >= data.length) break;

      const x = this.cordinateSystem.indexToX(fullDataIndex);
      ctx.beginPath();
      ctx.moveTo(x, paddingY);
      ctx.lineTo(x, height - paddingY);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data[fullDataIndex].date.slice(5), x, height - paddingY + 20);
    }
    
}

}