import { CordinateSystem } from "../utils/cordinate-system";
import { EventEmitter } from "../utils/event-emitter";

export interface InteractionHandler {
  handleMouseDown(event: MouseEvent, coordinateSystem: CordinateSystem): boolean;
  handleMouseMove(event: MouseEvent, coordinateSystem: CordinateSystem): boolean;
  handleMouseUp(event: MouseEvent, coordinateSystem: CordinateSystem): boolean;
  handleWheel(event: WheelEvent, coordinateSystem: CordinateSystem): boolean;
}

export class InteractionManager extends EventEmitter {
  private handlers: InteractionHandler[] = [];
  private canvas: HTMLCanvasElement;
  private cordinateSytem: CordinateSystem

  constructor(canvas: HTMLCanvasElement, cordinateSystem: CordinateSystem) {
    super();
    this.canvas = canvas;
    this.cordinateSytem = cordinateSystem
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
  }

  addHandler(handler: InteractionHandler): void {
    this.handlers.push(handler);
  }

  removeHandler(handler: InteractionHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (this.handlers[i].handleMouseDown(event, this.getCoordinateSystem())) {
        break;
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (this.handlers[i].handleMouseMove(event, this.getCoordinateSystem())) {
        break;
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (this.handlers[i].handleMouseUp(event, this.getCoordinateSystem())) {
        break;
      }
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    for (let i = this.handlers.length - 1; i >= 0; i--) {
      if (this.handlers[i].handleWheel(event, this.getCoordinateSystem())) {
        break;
      }
    }
  }

  private getCoordinateSystem(): CordinateSystem {
    return  this.cordinateSytem
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }
}