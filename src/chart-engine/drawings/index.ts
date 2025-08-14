import { CordinateSystem } from "../utils/cordinate-system";

export interface DrawingHandle {
  x: number;
  y: number;
  type: string;
}

export interface DrawingOptions {
  color?: string;
  lineWidth?: number;
  alpha?: number;
  fontSize?: number;
} 

export abstract class Drawing {
    public type: string;
    public color: string;
    public lineWidth: number

    constructor(type: string, options: DrawingOptions = {}){
        this.type = type,
        this.color = options.color || '#ffffff',
        this.lineWidth = options.lineWidth || 2
    }

    abstract render(ctx: CanvasRenderingContext2D, coordinateSystem: CordinateSystem): void;
  abstract hitTest(x: number, y: number, coordinateSystem: CordinateSystem): boolean;
  abstract move(deltaIndex: number, deltaPrice: number): void;
  abstract getHandles(coordinateSystem: CordinateSystem): DrawingHandle[];
}