import { Candle } from "../data/sample-data";
import { CordinateSystem, ViewWindowProps } from "../utils/cordinate-system";

export class CandleStickRenderer{

    private cordinateSystem: CordinateSystem

    constructor(cordinateSystem: CordinateSystem){
        this.cordinateSystem = cordinateSystem
    }

    render(
        ctx:CanvasRenderingContext2D,
        data: Candle[],
        viewWindow: ViewWindowProps
    ): void {
        const visibleData = data.slice(viewWindow.start, viewWindow.end)
        if(visibleData.length === 0) return;

       const availableChartWidth = this.cordinateSystem.chartDimensions.width - (2 * this.cordinateSystem.padding.x);
       const candleWidth = Math.max(1, availableChartWidth / (viewWindow.end - viewWindow.start) * 0.8);

    visibleData.forEach((candle,index) => {
        const fullDataIndex = viewWindow.start + index ;
        const x = this.cordinateSystem.indexToX(fullDataIndex);
        const openY = this.cordinateSystem.priceToY(candle.open)
        const highY = this.cordinateSystem.priceToY(candle.high)
        const lowY = this.cordinateSystem.priceToY(candle.low)
        const closeY = this.cordinateSystem.priceToY(candle.close)

        const isGreen = candle.close > candle.open

        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x - candleWidth/2, Math.min(openY, closeY), candleWidth, Math.max(bodyHeight, 1));
    })
    

}
}