"use client";
import { useEffect, useRef, useState } from "react";
import generateCandleStickData from "../../../lib/data"; // Ensure this provides {time, open, high, low, close}
import {
  createChart,
  IChartApi,
  CandlestickSeriesPartialOptions, // Import for typing options
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
} from "lightweight-charts";

function ChartRootPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<SeriesDataItemTypeMap>(
    null
  );
  const volumeSeriesRef = useRef<SeriesDataItemTypeMap>(
    null
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
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

    // Add main candlestick series
    const mainSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    mainSeriesRef.current = mainSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a", // Example default color, will be overridden
      priceFormat: {
        type: "volume",
      },
      overlay: true, // Crucial: overlays on top of the chart, not a separate pane
      scaleMargins: {
        top: 0.8, // 80% space for main chart
        bottom: 0, // No margin at the bottom of the volume pane
      },
    });
    volumeSeriesRef.current = volumeSeries;

    const candleStickData = generateCandleStickData(); // Ensure this provides time, open, high, low, close
    mainSeries.setData(candleStickData);

    // Prepare volume data based on candlestick data
    const volumeData = candleStickData.map((d) => ({
      time: d.time,
      value: d.volume || 0, // Ensure your data has volume, default to 0 if not
      color:
        d.open < d.close ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)", // Green for up, Red for down
    }));
    volumeSeries.setData(volumeData);

    // Fit content initially
    chart.timeScale().fitContent();

    // Store chart instance for cleanup
    chartRef.current = chart;

    // Handle window resize
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
        chartRef.current.remove(); // Clean up chart instance
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // --- How to add drawing tools ---

  // Example: Add a horizontal price line (e.g., support/resistance)
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
      // Price lines are added to the series' price scale
      mainSeriesRef.current.createPriceLine(priceLineOptions);
      console.log(`Added horizontal line at ${price}`);
    }
  };

  // Example: Add a simple trend line (as a LineSeries)
  // This requires you to define start and end points in terms of time and price.
  const addTrendLine = (
    startTime,
    startPrice,
    endTime,
    endPrice
  ) => {
    if (chartRef.current) {
      const lineSeries = chartRef.current.addLineSeries({
        color: "#00f",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        lastValueVisible: false, // Don't show last value label
        priceLineVisible: false, // Don't show price line
      } ); // Cast to suppress TS error, common with partial options

      const trendLineData = [
        { time: startTime, value: startPrice },
        { time: endTime, value: endPrice },
      ];
      lineSeries.setData(trendLineData);
      console.log(`Added trend line from ${startTime} to ${endTime}`);
      return lineSeries; // Return the series if you want to modify/remove it later
    }
    return null;
  };

  // --- Example usage within a button click or component ---
  useEffect(() => {
    // You might trigger these from a UI element
    if (mainSeriesRef.current && chartRef.current) {
      // Add a horizontal line 3 seconds after mount for demonstration
      setTimeout(() => {
        addHorizontalLine(
          mainSeriesRef.current.dataByIndex(
            mainSeriesRef.current.data().length - 5,
          ).close * 1.05,
          "Resistance",
        ); // Example: 5th last candle's close + 5%
        addHorizontalLine(
          mainSeriesRef.current.dataByIndex(
            mainSeriesRef.current.data().length - 10,
          ).open * 0.95,
          "Support",
        ); // Example: 10th last candle's open - 5%

        // Add a trend line from the start to near the end
        const initialData = mainSeriesRef.current.data();
        if (initialData.length > 20) {
          const startCandle = initialData[initialData.length - 20];
          const endCandle = initialData[initialData.length - 5];
          if (startCandle && endCandle) {
            addTrendLine(
              startCandle.time,
              startCandle.low,
              endCandle.time,
              endCandle.high,
            );
          }
        }
      }, 1000); // Give chart time to render data
    }
  }, []); // Run once after chart is initialized

  return <div ref={chartContainerRef} className="h-full w-full" />;
}

export default ChartRootPage;