"use client";
import { useEffect, useRef, useState } from "react";
import generateCandleStickData from "../../../lib/data"; // Ensure this provides {time, open, high, low, close, volume}
import {
  createChart,
  IChartApi,
  CandlestickSeriesPartialOptions,
  LineData,
  SeriesOptionsCommon,
  LineStyle,
  PriceLineOptions,
  Time,
  DeepPartial,
  LineSeriesOptions,
  Point,
  SeriesDataItemTypeMap,
  TimeRange,
  HistogramData,
  BusinessDay,
} from "lightweight-charts";
import TrendLineDrawingTool from "../drawing-tool/main"; // Import the new component

// Define a type for OHLC data for clarity

function ChartRootPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef(null); // Type explicitly
  const volumeSeriesRef = useRef(null); // Type explicitly

  // State to hold OHLC data for display
  const [ohlcData, setOhlcData] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#131722" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#363c4e" },
        horzLines: { color: "#363c4e" },
      },
      priceScale: {
        borderColor: "#48525e",
      },
      timeScale: {
        borderColor: "#48525e",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const mainSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    mainSeriesRef.current = mainSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      overlay: true,
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    const candleStickData = generateCandleStickData();
    mainSeries.setData(candleStickData);

    const volumeData = candleStickData.map((d) => ({
      time: d.time,
      value: d.volume || 0,
      color:
        d.open < d.close ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
    }));
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    // --- OHLC Data Display on Crosshair Move ---
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const data = param.seriesData.get(mainSeries); // Get data for the main series
        if (data && "open" in data) {
          // Check if it's a candle data item
          setOhlcData({
            time: data.time,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: param.seriesData.get(volumeSeries)?.value, // Get volume data if available
          });
        } else {
          setOhlcData(null); // No candle data at this point
        }
      } else {
        setOhlcData(null); // Mouse not over a data point
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Your existing addHorizontalLine function (still useful)
  const addHorizontalLine = (price, title) => {
    if (mainSeriesRef.current) {
      const priceLineOptions = {
        price: price,
        color: "#c3c3c3",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: title,
      };
      mainSeriesRef.current.createPriceLine(priceLineOptions);
      console.log(`Added horizontal line at ${price}`);
    }
  };

  useEffect(() => {
    if (mainSeriesRef.current && chartRef.current) {
      setTimeout(() => {
        const initialData = mainSeriesRef.current.data();
        if (initialData.length > 20) {
          addHorizontalLine(
            initialData[initialData.length - 5].close * 1.05,
            "Resistance",
          );
          addHorizontalLine(
            initialData[initialData.length - 10].open * 0.95,
            "Support",
          );
        }
      }, 1000);
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      {" "}
      {/* Use relative positioning for the parent container */}
      <div ref={chartContainerRef} className="h-full w-full" />
      {chartRef.current && mainSeriesRef.current && (
        <TrendLineDrawingTool
          chart={chartRef.current}
          series={mainSeriesRef.current}
        />
      )}
      {/* OHLC Data Display */}
      <div
        className="absolute top-2 left-2 p-2 text-white text-xs z-10"
        style={{ background: "rgba(0, 0, 0, 0.6)", borderRadius: "4px" }}
      >
        {ohlcData ? (
          <>
            <div>
              Time:{" "}
              {typeof ohlcData.time === "object" && "year" in ohlcData.time
                ? `${ohlcData.time.year}-${ohlcData.time.month}-${ohlcData.time.day}`
                : ohlcData.time?.toString()}
            </div>
            <div>Open: {ohlcData.open?.toFixed(2)}</div>
            <div>High: {ohlcData.high?.toFixed(2)}</div>
            <div>Low: {ohlcData.low?.toFixed(2)}</div>
            <div>Close: {ohlcData.close?.toFixed(2)}</div>
            <div>Volume: {ohlcData.volume?.toLocaleString()}</div>
          </>
        ) : (
          <div>Hover over a candle to see OHLC data</div>
        )}
      </div>
    </div>
  );
}

export default ChartRootPage;