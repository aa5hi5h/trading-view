import { PriceRangeProps, ViewWindowProps } from "../utils/cordinate-system";
import { EventEmitter } from "../utils/event-emitter";


export class Viewport extends EventEmitter {

    private dataLength: number;
    private viewWindow: ViewWindowProps;
    private priceRange: PriceRangeProps

    constructor(dataLength: number, initialVisibleCount = 100 ){
        super()
        this.dataLength = dataLength

        this.viewWindow = {
            start: Math.max(0, dataLength - initialVisibleCount),
            end: dataLength
        }
        this.priceRange = {min: 0, max: 100};
    }

    setDataLength(length:number): void{
        this.dataLength = length;
        if(this.viewWindow.end > length){
            this.viewWindow.end = length
            this.viewWindow.start = Math.max(0, length - (this.viewWindow.end - this.viewWindow.start))
        }

        this.emit("viewPortCHanged",this.getState())
    }

    setViewWindow(start:number, end:number): void{
        start = Math.max(0, start);
        end = Math.min(this.dataLength, end);
    
        if (start !== this.viewWindow.start || end !== this.viewWindow.end) {
           this.viewWindow = { start, end };
           this.emit('viewportChanged', this.getState());
        }
    }

    setPriceRange(min:number, max:number): void {
    if (min !== this.priceRange.min || max !== this.priceRange.max) {
      this.priceRange = { min, max };
      this.emit('viewportChanged', this.getState());
    }
  }

  zoom(factor:number, centerIndex:number): void {
    const currentRange = this.viewWindow.end - this.viewWindow.start;
    const newRange = Math.max(5, Math.min(Math.round(currentRange * factor), this.dataLength));
    
    const newStart = Math.round(centerIndex - (centerIndex - this.viewWindow.start) * (newRange / currentRange));
    this.setViewWindow(newStart, newStart + newRange);
  }

  pan(deltaIndex:number): void {
    const range = this.viewWindow.end - this.viewWindow.start;
    const newStart = this.viewWindow.start + deltaIndex;
    this.setViewWindow(newStart, newStart + range);
  }

  scalePriceRange(scaleFactor: number, centerPrice:number): void {
    const currentHeight = this.priceRange.max - this.priceRange.min;
    const newHeight = Math.max(0.01, currentHeight * scaleFactor);
    
    const centerRatio = (centerPrice - this.priceRange.min) / currentHeight;
    const newMin = centerPrice - newHeight * centerRatio;
    const newMax = centerPrice + newHeight * (1 - centerRatio);
    
    this.setPriceRange(newMin, newMax);
  }

    getState(){
        return {
            viewWindow : {...this.viewWindow},
            priceRange: {...this.priceRange} 
        }
    }
}