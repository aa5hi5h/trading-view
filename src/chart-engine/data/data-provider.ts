import { PriceRangeProps } from "../utils/cordinate-system";
import { EventEmitter } from "../utils/event-emitter";
import { Candle } from "./sample-data";


export class DataProvider extends EventEmitter {

    private data: Candle[];
    private priceRange: PriceRangeProps;

    constructor(initialData: Candle[] = []){
        super()
        this.data = initialData;
        this.priceRange = this.calculatePriceRange(0,initialData.length)
    }

    setData(data: Candle[]): void{
        this.data = data
        this.priceRange = this.calculatePriceRange()
        this.emit('dataChanged',this.data)
    }

    getData(): Candle[]{
        return this.data
    }

    getVisibleData(start:number,end:number): Candle[] {
        return this.data.slice(start,end)
    }

    calculatePriceRange(start = 0, end = this.data.length) {
    if (this.data.length === 0) return { min: 0, max: 100 };
    
    const visibleData = this.data.slice(start, end);
    if (visibleData.length === 0) return { min: 0, max: 100 };
    
    const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
    return {
      min: Math.min(...prices) * 0.98,
      max: Math.max(...prices) * 1.02
    };
  }

  getCandle(index: number): Candle | undefined{
    return this.data[index]
  }

  length(): number{
    return this.data.length
  }
}