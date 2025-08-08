import { useEffect, useRef } from "react"


const ChartEngine = () => {

    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current

        if(!canvas) return;

        const ctx = canvas.getContext("2d")

        if(!ctx) return ;


        canvas.width = 500
        canvas.height = 800

        ctx.clearRect(0,0,canvas.width,canvas.height)

        

        ctx.fillStyle = "red"
        ctx.fillRect(50,50,100,100)

        ctx.strokeStyle = "blue"
        ctx.lineWidth = 2
        ctx.moveTo(200,50)
        ctx.lineTo(300,150)
        ctx.stroke()

        ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Hello Chart (from Next.js)!', 350, 100);

        ctx.fill()
    },[])

    return (
        <div>
            <canvas ref={canvasRef} style={{border:"1px solid #4a4a6e", backgroundColor: "#0f0f1d"}} />
        </div>
    )
}

export default ChartEngine