"use client"
import { useEffect, useRef, useState } from "react"
import generateCandleStckData from "../../lib/data"
import { AreaSeries, BarSeries, CandlestickSeries, createChart, IChartApi, LineSeries } from "lightweight-charts"
import { CandlestickChart } from "lucide-react"
import generateCandleStickData from "../../lib/data"

function ChartRootPage() {

    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)

    useEffect(() => {
        if(chartContainerRef.current){
            chartRef.current = createChart(chartContainerRef.current,{
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight
            })

        const addSeries = chartRef.current?.addSeries(AreaSeries)

        const barSeries = chartRef.current?.addSeries(BarSeries)

        const candleStickData = generateCandleStickData()

        const mainSeries = chartRef.current?.addSeries(CandlestickSeries)

        mainSeries.setData(candleStickData)

        }

    
    
    
    chartRef.current?.timeScale().fitContent()

        return () => {
            if(chartRef.current){
                chartRef.current.remove()
            }
        }
    },[])


    return (
        <div ref={chartContainerRef}  className="h-full w-full" />
    )
}

export default ChartRootPage