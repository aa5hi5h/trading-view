
import { InteractionHandler } from "./main";
import { CordinateSystem } from "../utils/cordinate-system";
import { Viewport } from "../core/viewport";

export class ZoomHandler implements InteractionHandler {
  private viewport: Viewport;

  constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  handleMouseDown(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    return false; 
  }

  handleMouseMove(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    return false; 
  }

  handleMouseUp(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    return false; 
  }

  handleWheel(event: WheelEvent, coordinateSystem: CordinateSystem): boolean {
    if (coordinateSystem.isInChartArea(event.offsetX, event.offsetY)) {
      const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
      const centerIndex = coordinateSystem.xToIndex(event.offsetX);
      this.viewport.zoom(zoomFactor, centerIndex);
      return true;
    }
    return false;
  }
}