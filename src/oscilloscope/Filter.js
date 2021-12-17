export default class Filter {

    constructor(bufferSize, a, steps) {
        this.init(bufferSize, a, steps);
    }

    init(bufferSize, a, steps) {
        this.bufferSize = bufferSize;
        this.a = a;
        this.steps = steps;
        this.radius = a * steps;
        this.nSmoothedSamples = this.bufferSize*this.steps + 1;
        this.allSamples = new Float32Array(2*this.bufferSize);
        this.lanczosTweak = 1.5;

        this.createLanczosKernel();
    }

    generateSmoothedSamples(oldSamples, samples, smoothedSamples) {
        //this.createLanczosKernel();
        const bufferSize = this.bufferSize;
        const allSamples = this.allSamples;
        const nSmoothedSamples = this.nSmoothedSamples;
        const a = this.a;
        const steps = this.steps;
        const K = this.K;

        for (let i=0; i<bufferSize; i++)
        {
            allSamples[i] = oldSamples[i];
            allSamples[bufferSize+i] = samples[i];
        }

        /*for (var s= -a+1; s<a; s++)
        {
            for (var r=0; r<steps; r++)
            {
                if (r==0 && !(s==0)) continue;
                var kernelPosition = -r+s*steps;
                if (kernelPosition<0) k = K[-kernelPosition];
                else k = K[kernelPosition];

                var i = r;
                var pStart = bufferSize - 2*a + s;
                var pEnd = pStart + bufferSize;
                for (var p=pStart; p<pEnd; p++)
                {
                    smoothedSamples[i] += k * allSamples[p];
                    i += steps;
                }
            }
        }*/

        const pStart = bufferSize - 2*a;
        const pEnd = pStart + bufferSize;
        let i = 0;
        for (let position=pStart; position<pEnd; position++)
        {
            smoothedSamples[i] = allSamples[position];
            i += 1;
            for (let r=1; r<steps; r++)
            {
                let smoothedSample = 0;
                for (let s= -a+1; s<a; s++)
                {
                    const sample = allSamples[position+s];
                    const kernelPosition = -r+s*steps;
                    if (kernelPosition<0) smoothedSample += sample * K[-kernelPosition];
                    else smoothedSample += sample * K[kernelPosition];
                }
                smoothedSamples[i] = smoothedSample;
                i += 1;
            }
        }

        smoothedSamples[nSmoothedSamples-1] = allSamples[2*bufferSize-2*a];
    }

    createLanczosKernel()
    {
        this.K = new Float32Array(this.radius);
        this.K[0] = 1;
        for (let i =1; i<this.radius; i++)
        {
            const piX = (Math.PI * i) / this.steps;
            const sinc = Math.sin(piX)/piX;
            const window = this.a * Math.sin(piX/this.a) / piX;
            this.K[i] = sinc*Math.pow(window, this.lanczosTweak);
        }
    }
}