

export interface ChartDimensionsProps{
    width: number 
    height: number
}

export interface PriceRangeProps{
    min: number,
    max:number
}

export interface ViewWindowProps{
    start: number
    end:number
}

export interface PaddingProps{
    x: number,
    y: number
}

export class CordinateSystem{
    public chartDimensions: ChartDimensionsProps;
    public priceRange: PriceRangeProps;
    public viewWindow: ViewWindowProps;
    public padding: PaddingProps;

    constructor(
        chartdimensions: ChartDimensionsProps,
        priceRange: PriceRangeProps,
        viewWindow: ViewWindowProps,
        padding: PaddingProps = {x: 40, y:60}
    ){
        this.chartDimensions = chartdimensions
        this.priceRange = priceRange
        this.viewWindow = viewWindow
        this.padding = padding
    }

    updateDimensions(chartDimensions: ChartDimensionsProps): void{
        this.chartDimensions = chartDimensions
    }

    updatePriceRange(priceRange: PriceRangeProps): void{
        this.priceRange = priceRange
    }

    updateViewWindow(viewWindow: ViewWindowProps): void{
        this.viewWindow = viewWindow
    }

    priceToY(price:number): number{

        const {height} = this.chartDimensions;
        const chartHeight = height - 2 * this.padding.y
        if(chartHeight <= 0 || this.priceRange.max === this.priceRange.min){
            return this.padding.y
        }
        return this.padding.y + ((this.priceRange.max - price)/(this.priceRange.max - this.priceRange.min)) * chartHeight
    }

    indexToX(index:number): number{
        const {width}= this.chartDimensions
        const visibleRange = this.viewWindow.end - this.viewWindow.start
        const chartWidth = width - 2 * this.padding.x
        if( visibleRange === 0 || chartWidth <= 0) return this.padding.x
        
        return this.padding.x + ((index - this.viewWindow.start)/(this.viewWindow.end - this.viewWindow.start)) * chartWidth
    }

    xToIndex(x:number): number{
        const {width} = this.chartDimensions
        const visibleRange = this.viewWindow.end - this.viewWindow.start
        const chartWidth = width - 2 * this.padding.x
        if(chartWidth <= 0) return 0

        const clampedX = Math.max(this.padding.x , Math.min(x, width - this.padding.x))
        return Math.round(this.viewWindow.start + (clampedX - this.padding.x) / chartWidth * visibleRange);
    }

    yToPrice(y:number):number{
        const {height} = this.chartDimensions
        const chartHeight = height - 2 * this.padding.y
        if(chartHeight <= 0 || this.priceRange.max === this.priceRange.min){
            return this.priceRange.min
        }
    const clampedY = Math.max(this.padding.y, Math.min(y, height - this.padding.y));
    return this.priceRange.max - (clampedY - this.padding.y) / chartHeight * (this.priceRange.max - this.priceRange.min);
    }

    getChartBounds() {
    return {
      left: this.padding.x,
      right: this.chartDimensions.width - this.padding.x,
      top: this.padding.y,
      bottom: this.chartDimensions.height - this.padding.y
    };
  }

  isInChartArea(x:number, y:number) {
    const bounds = this.getChartBounds();
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
  }

  isInYAxisArea(x:number, y:number) {
    return x >= 0 && x <= this.padding.x && y >= 0 && y <= this.chartDimensions.height;
  }

  isInXAxisArea(x:number, y:number) {
    const { width, height } = this.chartDimensions;
    return y >= height - this.padding.y && y <= height && x >= 0 && x <= width;
  }

}