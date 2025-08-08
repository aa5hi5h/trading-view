"use client"
// components/TrendLineDrawingTool.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  IChartApi,
  ISeriesApi,
  Time,
  LineStyle,
  LineSeriesPartialOptions,
  DeepPartial,
  LineData,
  WhitespaceData,
} from "lightweight-charts";



const TrendLineDrawingTool= ({
  chart,
  series,
}) => {
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [currentLinePoints, setCurrentLinePoints] = useState(null);
  const [trendLines, setTrendLines] = useState([]);
  const lineSeriesRef = useRef(null);

  // Function to convert screen coordinates (X) to time and price (Y)
  const screenToTimeAndPrice = useCallback(
    (x, y) => {
      if (!chart || !series) return null;

      const timeScale = chart.timeScale();
      const logicalRange = timeScale.getVisibleRange();
      if (!logicalRange) return null;

      const coordinate = timeScale.coordinateToLogical(x);
      const time = timeScale.coordinateToTime(x);

      const priceScale = series.priceScale();
      const price = priceScale.coordinateToPrice(y);

      if (time === null || price === null) return null; // Ensure time and price are valid

      return { time, price };
    },
    [chart, series],
  );

  useEffect(() => {
    if (!chart || !series) return;

    // Click handler for drawing
    const handleChartClick = (param) => {
      if (!param.point) return; // No click point available

      const { time, price } = screenToTimeAndPrice(
        param.point.x,
        param.point.y,
      );

      if (time === null || price === null) return; // ensure valid time/price

      if (!drawingMode) {
        // Start drawing a new line
        setDrawingMode(true);
        setCurrentLinePoints({ time, price });

        // Add a temporary line series for preview
        const newLineSeries = chart.addLineSeries({
          color: "orange",
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lineSeriesRef.current = newLineSeries;
        newLineSeries.setData([{ time, value: price }]);
      } else {
        // End drawing the current line
        if (currentLinePoints) {
          const finalLineData = [
            { time: currentLinePoints.time, value: currentLinePoints.price },
            { time, value: price },
          ];

          // If a temporary series exists, update its data to the final two points
          if (lineSeriesRef.current) {
            lineSeriesRef.current.setData(finalLineData);
            setTrendLines((prev) => [
              ...prev,
              {
                id: `trendline-${Date.now()}`,
                series: lineSeriesRef.current, // Add the reference to the actual series
                points: [currentLinePoints, { time, price }],
              },
            ]);
            lineSeriesRef.current = null; // Clear the ref
          }
        }
        setDrawingMode(false);
        setCurrentLinePoints(null);
      }
    };

    // Mouse move handler for preview
    const handleCrosshairMove = (param) => {
      if (!drawingMode || !lineSeriesRef.current || !currentLinePoints) return;
      if (!param.point) return;

      const { time, price } = screenToTimeAndPrice(
        param.point.x,
        param.point.y,
      );
      if (time === null || price === null) return;

      // Update the temporary line series to follow the mouse
      lineSeriesRef.current.setData([
        { time: currentLinePoints.time, value: currentLinePoints.price },
        { time, value: price },
      ]);
    };

    chart.subscribeClick(handleChartClick);
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeClick(handleChartClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);

      // Clean up any remaining temporary line if unmounted while drawing
      if (lineSeriesRef.current) {
        chart.removeSeries(lineSeriesRef.current);
        lineSeriesRef.current = null;
      }
      // Remove all created trend lines when component unmounts
      trendLines.forEach((line) => {
        chart.removeSeries(line.series);
      });
    };
  }, [chart, series, drawingMode, currentLinePoints, screenToTimeAndPrice, trendLines]);

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
      <button
        onClick={() => setDrawingMode(!drawingMode)}
        style={{
          padding: "8px 12px",
          backgroundColor: drawingMode ? "lightblue" : "#eee",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {drawingMode ? "Stop Drawing Trendline" : "Start Drawing Trendline"}
      </button>
    </div>
  );
};

export default TrendLineDrawingTool;