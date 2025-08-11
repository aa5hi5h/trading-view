import { CandlestickData } from "lightweight-charts";
import { BollingerBand } from "../renders/indicator";
import { SMA } from "./sma";

export class BollingerBands {
  static calculate(data: CandlestickData[], period: number = 20, stdDev: number = 2): BollingerBand[] {
    const sma = SMA.calculate(data, period);
    
    return data.map((_, index) => {
      if (index < period - 1) return { upper: null, middle: null, lower: null };
      
      const slice = data.slice(index - period + 1, index + 1);
      const mean = sma[index]!;
      const variance = slice.reduce((acc, item) => acc + Math.pow(item.close - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      };
    });
  }
}