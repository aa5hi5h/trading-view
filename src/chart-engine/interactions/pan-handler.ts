import { Viewport } from "../core/viewport";
import { CordinateSystem } from "../utils/cordinate-system";
import { InteractionHandler } from "./main";

export class PanHandler implements InteractionHandler {
  private isPanning: boolean = false;
  private lastX: number = 0;
  private viewport: Viewport;

  constructor(viewport: Viewport) {
    this.viewport = viewport;
  }

  handleMouseDown(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    if (event.button === 0 && coordinateSystem.isInChartArea(event.offsetX, event.offsetY)) {
      this.isPanning = true;
      this.lastX = event.offsetX;
      return true;
    }
    return false;
  }

  handleMouseMove(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    if (this.isPanning) {
      const deltaX = event.offsetX - this.lastX;
      const deltaIndex = -coordinateSystem.xToIndex(event.offsetX) + coordinateSystem.xToIndex(this.lastX);
      this.viewport.pan(deltaIndex);
      this.lastX = event.offsetX;
      return true;
    }
    return false;
  }

  handleMouseUp(event: MouseEvent, coordinateSystem: CordinateSystem): boolean {
    if (this.isPanning) {
      this.isPanning = false;
      return true;
    }
    return false;
  }

  handleWheel(event: WheelEvent, coordinateSystem: CordinateSystem): boolean {
    return false;
  }
}
