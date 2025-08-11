import { CandlestickData } from "lightweight-charts";
import { EMA } from "./ema";

export interface MACDResult{
    macdLine: number[],
    signalLine: number[],
    histogram: number[]
}

export class MACD {
  static calculate(data: CandlestickData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult {
    const fastEMA = EMA.calculate(data, fastPeriod);
    const slowEMA = EMA.calculate(data, slowPeriod);
    
    const macdLine = fastEMA.map((fast, index) => fast - slowEMA[index]);
    const signalLine = EMA.calculate(macdLine.map((value) => ({ close: value } as CandlestickData)), signalPeriod);
    const histogram = macdLine.map((macd, index) => macd - signalLine[index]);
    
    return { macdLine, signalLine, histogram };
  }
}