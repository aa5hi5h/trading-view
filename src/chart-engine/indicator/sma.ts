import { Candle } from "../data/sample-data";


export class SMA {
  static calculate(data: Candle[], period: number): (number | null)[] {
    return data.map((_, index) => {
      if (index < period - 1) return null;
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, item) => acc + item.close, 0);
      return sum / period;
    });
  }
}