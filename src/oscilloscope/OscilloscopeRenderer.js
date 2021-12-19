export default class OscilloscopeRenderer {

    constructor(canvas) {
        this.canvas = canvas;
        this.drawingContext = canvas.getContext('2d');
        this.drawingContext.strokeStyle = "#ff3e00";
        this.drawingContext.lineWidth = 1;
    }

    init() {

    }

    /*
        callback from SoundwaveProcessor
     */
    draw(data) {
        //return;
        console.log('draw', data);
        /*
        const { xSamples, ySamples, mainGain } = data;
        if (xSamples && ySamples) {
            this.drawLineTexture(xSamples, ySamples, mainGain);
        }
        */

        // const { xSamples, ySamples } = data;
        // if (xSamples && xSamples.length) {
        if (data.length) {
            /*
            if (this.rafId) cancelAnimationFrame(this.rafId);
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                this.drawSample(data);
            })
            */
            this.drawSample(data[0]);
        }
    }

    drawSample(data) {
        //console.log(data)
        const { xSamples, ySamples } = data;
        const { width, height } = this.canvas;
        const { x: startX, y: startY } = this.getWavePointCoordsAtIndex(data, 0, width, height);


        //this.drawingContext.clearRect(0, 0, width, height);
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(startX, startY);

        for(let i = 1; i < xSamples.length; i++) {

            const { x, y } = this.getWavePointCoordsAtIndex(data, i, width, height);
            //console.log({x ,y});
            this.drawingContext.lineTo(x, y);
        }

        this.drawingContext.stroke();
    }

    getWavePointCoordsAtIndex(waveData, index, canvasWidth, canvasHeight) {
        const { xSamples, ySamples } = waveData;
        const padding = 100;   // avoid clipping of top points
        const yOffset = padding / 2;
        const height = canvasHeight - padding;

        const xOffset = canvasWidth / 2;

        return {
            x: xOffset + xSamples[index] * canvasWidth,
            y: yOffset + (0.5 + ySamples[index] / 2) * height,
        }
    }
}