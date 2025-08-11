import { CandlestickData } from "lightweight-charts";

export class EMA {
  static calculate(data: CandlestickData[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    data.forEach((item, index) => {
      if (index === 0) {
        ema.push(item.close);
      } else {
        ema.push((item.close - ema[index - 1]) * multiplier + ema[index - 1]);
      }
    });
    
    return ema;
  }
}