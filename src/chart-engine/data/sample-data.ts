export interface Candle{
    date: string,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number
}

export class SampleData{
    static generate( days = 100 ,startPrice = 100): Candle[]{
        const data: Candle[] = []
        let price: number = startPrice
        const startDate: Date = new Date()
        startDate.setDate(startDate.getDate()  - days)

        for(let i =0; i < days; i++ ){
            const date = new Date(startDate)
            date.setDate(date.getDate() + 1)

            const volatility: number = 0.02
            const change: number = (Math.random() - 0.5) * volatility * price
            const open: number =price
            const close: number = price + change
            const high: number = Math.max(open,close) + Math.random() * 0.01 * price
            const low: number = Math.min(open,close) - Math.random() * 0.01 * price
            const volume :number = Math.floor(Math.random() * 1000000 + 500000)

            data.push({
                date: date.toISOString().split('T')[0],
                open,
                high,
                low,
                close,
                volume
            })

            price = close
        }

        return data
    }
}