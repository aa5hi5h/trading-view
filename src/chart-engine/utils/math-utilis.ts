
export class MathUtils {
    static clamp(value:number, min: number, max:number):number{
        return Math.min(Math.max(min,value),max)
    }

    static distanceToLine(x:number,y:number,x1:number,y1:number,x2:number,y2:number): number{
        const A = x - x1
        const B = y - y1
        const C = x2 - x1 
        const D = y2 - y1
        
        const dot = A*B + C*D
        const lensq =  C*C + D*D

        if(lensq === 0){
            return Math.sqrt(A*A + B*B)
        }

        let param = dot/lensq
        param = MathUtils.clamp(param,0,1)

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}