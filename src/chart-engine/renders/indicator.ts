import { Candle } from "../data/sample-data";
import { CordinateSystem, ViewWindowProps } from "../utils/cordinate-system";

export interface BollingerBand{
    upper : number | null,
    middle: number | null,
    lower: number | null
}

export class IndicatorRender {

    public cordinateSystem: CordinateSystem

    constructor(cordinateSystem:CordinateSystem){
        this.cordinateSystem = cordinateSystem
    }

    renderSMA(
        ctx: CanvasRenderingContext2D,
        data: Candle[],
        values: (number | null)[],
        period: number,
        color: string = '#3b82f6', 
        lineWidth: number = 2,
        viewWindow: ViewWindowProps 
    ): void{
        ctx.strokeStyle = color,
        ctx.lineWidth = lineWidth,
        ctx.beginPath()
        let firstPoint = true;
    for (let index = viewWindow.start; index < viewWindow.end; index++) {
      if (values[index] !== null) {
        const x = this.cordinateSystem.indexToX(index);
        const y = this.cordinateSystem.priceToY(values[index]!);
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        firstPoint = true;
      }
    }
    ctx.stroke();
  }

  renderBollingerBands(
    ctx: CanvasRenderingContext2D,
    data: Candle[],
    bands: BollingerBand[], 
    color: string = '#8b5cf6', 
    lineWidth: number = 1, 
    viewWindow: ViewWindowProps
  ): void{
    ctx.beginPath();
    let firstPoint = true;
    for (let index = viewWindow.start; index < viewWindow.end; index++) {
      const band = bands[index];
      if (band && band.upper !== null) {
        const x = this.cordinateSystem.indexToX(index);
        const y = this.cordinateSystem.priceToY(band.upper);
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        firstPoint = true;
      }
    }
    ctx.stroke();

    ctx.beginPath();
    firstPoint = true;
    for (let index = viewWindow.start; index < viewWindow.end; index++) {
      const band = bands[index];
      if (band && band.lower !== null) {
        const x = this.cordinateSystem.indexToX(index);
        const y = this.cordinateSystem.priceToY(band.lower);
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        firstPoint = true;
      }
    }
    ctx.stroke();
  }
}