import {createShader, getColourFromHue, makeTexture} from './oscilloscope-helper';
import Filter from './Filter';

let gl;

export default class OscilloscopeRenderer {

    constructor(canvas) {
        canvas.width = canvas.height = 800;
        gl = canvas.getContext('webgl', /*{ preserveDrawingBuffer: true, alpha: false }*/);

        this.canvas = canvas;
        this.bufferSize = 512;
        this.persistence = 0;       //input id="persistence" type="range" width="200" min="-1" max="1" value=0 step=0.01
        this.exposureStops = 0.0;   //input  id="exposure" type="range" width="200" min="-2" max="2" value=0.0 step=0.1
        this.hue = 125;             //input id="hue" type="range" width="200" min="0" max="359" value=125 step=1
        this.filterSteps = 6;
        this.showGrid = true;
        this.filter = new Filter(this.bufferSize, 8, this.filterSteps);

        this.drawCRT = this.drawCRT.bind(this);
        this.drawCRTFrame = this.drawCRTFrame.bind(this);
    }

    init() {
        console.log('init');
        // window.onresize = this.onResize;

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.enable(gl.BLEND);
        gl.blendEquation( gl.FUNC_ADD );
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.colorMask(true, true, true, true);

        const ext1 = gl.getExtension('OES_texture_float');
        const ext2 = gl.getExtension('OES_texture_float_linear');
        if (!ext1 || !ext2)
        {
            console.error('could not initialize GL textures');
            return;
        }

        this.fadeAmount = 0.2 * this.bufferSize/512;
        this.fullScreenQuad = new Float32Array([
            -1, 1, 1, 1,  1,-1,  // Triangle 1
            -1, 1, 1,-1, -1,-1   // Triangle 2
        ]);

        this.simpleShader = createShader(gl, 'vertex','fragment');
        this.simpleShader.vertexPosition = gl.getAttribLocation(this.simpleShader, 'vertexPosition');
        this.simpleShader.colour = gl.getUniformLocation(this.simpleShader, 'colour');

        this.lineShader = createShader(gl, 'gaussianVertex','gaussianFragment');
        this.lineShader.aStart = gl.getAttribLocation(this.lineShader, 'aStart');
        this.lineShader.aEnd = gl.getAttribLocation(this.lineShader, 'aEnd');
        this.lineShader.aIdx = gl.getAttribLocation(this.lineShader, 'aIdx');
        this.lineShader.uGain = gl.getUniformLocation(this.lineShader, 'uGain');
        this.lineShader.uSize = gl.getUniformLocation(this.lineShader, 'uSize');
        this.lineShader.uInvert = gl.getUniformLocation(this.lineShader, 'uInvert');
        this.lineShader.uIntensity = gl.getUniformLocation(this.lineShader, 'uIntensity');
        this.lineShader.uNEdges = gl.getUniformLocation(this.lineShader, 'uNEdges');
        this.lineShader.uFadeAmount = gl.getUniformLocation(this.lineShader, 'uFadeAmount');
        this.lineShader.uScreen = gl.getUniformLocation(this.lineShader, 'uScreen');

        this.outputShader = createShader(gl, 'outputVertex','outputFragment');
        this.outputShader.aPos = gl.getAttribLocation(this.outputShader, 'aPos');
        this.outputShader.uTexture0 = gl.getUniformLocation(this.outputShader, 'uTexture0');
        this.outputShader.uTexture1 = gl.getUniformLocation(this.outputShader, 'uTexture1');
        this.outputShader.uTexture2 = gl.getUniformLocation(this.outputShader, 'uTexture2');
        this.outputShader.uTexture3 = gl.getUniformLocation(this.outputShader, 'uTexture3');
        this.outputShader.uExposure = gl.getUniformLocation(this.outputShader, 'uExposure');
        this.outputShader.uColour = gl.getUniformLocation(this.outputShader, 'uColour');
        this.outputShader.uResizeForCanvas = gl.getUniformLocation(this.outputShader, 'uResizeForCanvas');
        this.outputShader.graticuleLight = gl.getUniformLocation(this.outputShader, 'graticuleLight');

        this.texturedShader = createShader(gl, 'texturedVertexWithResize','texturedFragment');
        this.texturedShader.aPos = gl.getAttribLocation(this.texturedShader, 'aPos');
        this.texturedShader.uTexture0 = gl.getUniformLocation(this.texturedShader, 'uTexture0');
        this.texturedShader.uResizeForCanvas = gl.getUniformLocation(this.texturedShader, 'uResizeForCanvas');

        this.blurShader = createShader(gl, 'texturedVertex','blurFragment');
        this.blurShader.aPos = gl.getAttribLocation(this.blurShader, 'aPos');
        this.blurShader.uTexture0 = gl.getUniformLocation(this.blurShader, 'uTexture0');
        this.blurShader.uOffset = gl.getUniformLocation(this.blurShader, 'uOffset');

        this.vertexBuffer = gl.createBuffer();
        this.setupTextures();

        const nPoints = this.bufferSize * this.filterSteps + 1;
        this.setupArrays(nPoints);

        requestAnimationFrame(this.drawCRTFrame);
    }

    onResize() {
        if (this.lineTexture) {
            const renderWidth = Math.min(this.canvas.width, 1024);
            const renderHeight = Math.min(this.canvas.height, 1024);
            this.lineTexture.width = renderWidth;
            this.lineTexture.height = renderHeight;
        }

    }

    setupTextures() {
        console.log('setupTextures');
        this.frameBuffer = gl.createFramebuffer();
        this.lineTexture = makeTexture(gl, 1024, 1024);
        this.onResize();
        this.blur1Texture = makeTexture(gl, 256,256);
        this.blur2Texture = makeTexture(gl, 256, 256);
        this.blur3Texture = makeTexture(gl, 32, 32);
        this.blur4Texture = makeTexture(gl, 32, 32);
        this.screenTexture = this.loadTexture('noise.jpg');

        // test floating point textures working
        this.activateTargetTexture(this.lineTexture);
        if (gl.FRAMEBUFFER_COMPLETE !== gl.checkFramebufferStatus(gl.FRAMEBUFFER)) {
            console.error('could not activate floating point textures');
        }

        console.log('setupTextures', gl.checkFramebufferStatus(gl.FRAMEBUFFER), gl.FRAMEBUFFER_COMPLETE, this.frameBuffer);
    }

    loadTexture(fileName) {
        console.log('loadTexture');
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Fill with grey pixel, as placeholder until loaded
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([128, 128, 128, 255]));
        // Asynchronously load an image
        const image = new Image();
        image.src = fileName;
        image.addEventListener('load', () => {
            console.log('image loaded');
            // Now that the image has loaded copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            //hardcoded:
            texture.width = texture.height = 512;
            this.fillBlueChannel(texture);
            if (this.showGrid) this.drawGrid(texture);
        });
        return texture;
    }

    fillBlueChannel(texture) {
        console.log('fillBlueChannel');
        this.activateTargetTexture(texture);
        gl.colorMask(false, false, true, true);
        this.setNormalBlending();

        const program = this.simpleShader;
        gl.useProgram(program);
        gl.enableVertexAttribArray(program.vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.fullScreenQuad, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.uniform4fv(program.colour, [0.0, 0.0, 1.0, 1.0]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(program.vertexPosition);
        gl.colorMask(true, true, true, true);
    }

    drawGrid(texture) {
        console.log('drawGrid');
        this.activateTargetTexture(texture);
        this.setNormalBlending();
        this.setShader(this.simpleShader);

        gl.colorMask(true, false, true, true);

        const data = [];
        const step = 48;
        let t;

        for (let i = 0; i < 11; i++)
        {
            const step = 48;
            const s = i * step;
            data.splice(0,0, 0, s, 10*step, s);
            data.splice(0,0, s, 0, s, 10*step);
            if (i !== 0 && i !== 10)
            {
                for (let j=0; j<51; j++)
                {
                    t = j*step/5;
                    if (i !== 5)
                    {
                        data.splice(0,0, t, s-2, t, s+1);
                        data.splice(0,0, s-2, t, s+1, t);
                    }
                    else
                    {
                        data.splice(0,0, t, s-5, t, s+4);
                        data.splice(0,0, s-5, t, s+4, t);
                    }
                }
            }
        }

        for (let j=0; j<51; j++)
        {
            const t = j*step/5;
            if (t%5 == 0) continue;
            data.splice(0,0, t-2, 2.5*step, t+2, 2.5*step);
            data.splice(0,0, t-2, 7.5*step, t+2, 7.5*step);
        }


        const vertices = new Float32Array(data);
        for (let i=0; i<data.length; i++)
        {
            vertices[i]=(vertices[i]+256-step*5)/256-1;
        }


        gl.enableVertexAttribArray(this.program.vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.program.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.uniform4fv(this.program.colour, [0.01, 0.1, 0.01, 1.0]);

        gl.lineWidth(1.0);
        gl.drawArrays(gl.LINES, 0, vertices.length/2);

        gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.colorMask(true, true, true, true);
    }

    activateTargetTexture(texture) {
        console.log('activateTargetTexture');
        if (texture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            gl.viewport(0, 0, texture.width, texture.height);
        }
        else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        this.targetTexture = texture;
    }

    setupArrays(nPoints) {
        console.log('setupArrays');
        let indices;

        this.nPoints = nPoints;
        this.nEdges = this.nPoints-1;

        this.quadIndexBuffer = gl.createBuffer();
        indices = new Float32Array(4 * this.nEdges);
        for (let i = 0; i < indices.length; i++)
        {
            indices[i] = i;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.vertexIndexBuffer = gl.createBuffer();
        const len = this.nEdges * 2 * 3;
        indices = new Uint16Array(len);
        for (let i = 0, pos = 0; i < len;)
        {
            indices[i++] = pos;
            indices[i++] = pos + 2;
            indices[i++] = pos + 1;
            indices[i++] = pos + 1;
            indices[i++] = pos + 2;
            indices[i++] = pos + 3;
            pos += 4;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


        this.scratchVertices = new Float32Array(8 * nPoints);
    }

    setShader(program) {
        console.log('setShader');
        this.program = program;
        gl.useProgram(program);
    }

    drawCRTFrame(timeStamp) {
        console.log('drawCRTFrame');
        this.drawCRT();
        //this.drawTest();
        //requestAnimationFrame(this.drawCRTFrame);
    }

    /////////////////////////////////////////////////////////////

    start() {
        var vertexShader = this.getShader(
                gl,
                gl.VERTEX_SHADER,
                `
attribute vec4 aPosition;

void main() {
  gl_Position = aPosition;
}`
            ),
            fragmentShader = this.getShader(
                gl,
                gl.FRAGMENT_SHADER,
                `void main() {
  gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
}`
            );

        this.program = this.createProgram(gl, vertexShader, fragmentShader);

        gl.useProgram(this.program);
    }

    getShader(gl,type,source) {
        /**
         * Get, compile, and return an embedded shader object
         **/
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // Check if compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log("An error occurred compiling the shaders:" + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        /**
         * Create and return a shader program
         **/
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        // Check that shader program was able to link to WebGL
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            var error = gl.getProgramInfoLog(program);
            console.log('Failed to link program: ' + error);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            return null;
        }
        //gl.useProgram(program);
        return program;
    }

    drawTest() {
        var VSHADER_SOURCE =
            'attribute vec4 a_Position;\n' +
            'attribute float a_PointSize;\n' +
            'void main() {\n' +
            '   gl_Position = a_Position;\n' +
            '   gl_PointSize = a_PointSize;\n' +
            '}\n';
        var FSHADER_SOURCE = [
            'precision mediump float;',
            'uniform vec4 u_FragColor;',
            'void main() {',
            'gl_FragColor = u_FragColor;',
            '}'
        ].join('\n');
        var loadShader = function(gl, type, source){
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            console.log( type, compiled);
            return shader;
        }
        var vertexShader = loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
        var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
        var program = gl.createProgram();

        this.activateTargetTexture(null)

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        gl.program = program;

        var verticies = new Float32Array([
                0.0, 0.0
            ]),
            n = 1,
            vertexBuffer = gl.createBuffer();
        if(!vertexBuffer) {
            console.log('meh')
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticies, gl.STATIC_DRAW);
        var a_position = gl.getAttribLocation(gl.program, 'a_Position');
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(a_position);

        const a_pointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
        const u_fragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
        gl.uniform4f(u_fragColor, 1.0, 0.0,0.0,1.0);
        gl.vertexAttrib1f(a_pointSize, 10.0);

        function render() {
            requestAnimationFrame(render);
            gl.clearColor(0.0,0.0,0.0,1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, n);
        }

        render()
        /*
        this.start();
        // Write the positions of vertices to a vertex shader
        var n = this.initBuffers(gl);
        if (n < 0) {
            console.log('Failed to set the positions of the vertices');
            return;
        }

        // Specify the color for clearing <canvas>
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw a line
        gl.drawArrays(gl.LINES, 0, n);
        */
    }

    initBuffers() {
        var vertices = new Float32Array([
            // -0.5, -0.5,   +0.5, +0.5
            -0.5,
            -0.5,
            -0.25,
            +0.5,
            0.25,
            0.0,
            0.0,
            +0.5
        ]);
        // The number of vertices
        // var n = 2;
        var n = 4;

        // Create a buffer object
        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        // target: ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        // Write date into the buffer object
        // target, size
        // usage: STATIC_DRAW, STREAM_DRAW, DYNAMIC_DRAW
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        var aPosition = gl.getAttribLocation(this.program, 'aPosition');
        if (aPosition < 0) {
            console.log('Failed to get the storage location of aPosition');
            return -1;
        }

        // Enable the assignment to aPosition variable
        gl.enableVertexAttribArray(aPosition);

        // Assign the buffer object to aPosition variable
        // https://www.khronos.org/opengles/sdk/docs/man/xhtml/glVertexAttribPointer.xml
        // index, size, type, normalized, stride, pointer
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);



        return n;
    }

    ///////////////////////////////////////////////////////////////////////

    drawCRT() {
        console.log('drawCRT');
        this.setNormalBlending();

        this.activateTargetTexture(this.blur1Texture);
        this.setShader(this.texturedShader);
        gl.uniform1f(this.texturedShader.uResizeForCanvas, this.lineTexture.width/1024);
        this.drawTexture(this.lineTexture);

        //horizontal blur 256x256
        this.activateTargetTexture(this.blur2Texture);
        this.setShader(this.blurShader);
        gl.uniform2fv(this.blurShader.uOffset, [1.0/256.0, 0.0]);
        this.drawTexture(this.blur1Texture);

        //vertical blur 256x256
        this.activateTargetTexture(this.blur1Texture);
        //this.setShader(this.blurShader);
        gl.uniform2fv(this.blurShader.uOffset, [0.0, 1.0/256.0]);
        this.drawTexture(this.blur2Texture);

        //preserve blur1 for later
        this.activateTargetTexture(this.blur3Texture);
        this.setShader(this.texturedShader);
        gl.uniform1f(this.texturedShader.uResizeForCanvas, 1.0);
        this.drawTexture(this.blur1Texture);

        //horizontal blur 64x64
        this.activateTargetTexture(this.blur4Texture);
        this.setShader(this.blurShader);
        gl.uniform2fv(this.blurShader.uOffset, [1.0/32.0, 1.0/60.0]);
        this.drawTexture(this.blur3Texture);

        //vertical blur 64x64
        this.activateTargetTexture(this.blur3Texture);
        //this.setShader(this.blurShader);
        gl.uniform2fv(this.blurShader.uOffset, [-1.0/60.0, 1.0/32.0]);
        this.drawTexture(this.blur4Texture);

        this.activateTargetTexture(null);
        this.setShader(this.outputShader);
        const brightness = Math.pow(2, this.exposureStops-2.0);
        //if (controls.disableFilter) brightness *= Filter.steps;
        gl.uniform1f(this.outputShader.uExposure, brightness);
        gl.uniform1f(this.outputShader.uResizeForCanvas, this.lineTexture.width/1024);
        const colour = getColourFromHue(this.hue);
        gl.uniform3fv(this.outputShader.uColour, colour);
        //if (controls.light) gl.uniform1f(this.outputShader.graticuleLight, 0.15);
        /*else*/ gl.uniform1f(this.outputShader.graticuleLight, 0.0);
        this.drawTexture(this.lineTexture, this.blur1Texture, this.blur3Texture, this.screenTexture);
    }

    drawTexture(texture0, texture1, texture2, texture3) {
        console.log('drawTexture');
        //gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.program.aPos);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniform1i(this.program.uTexture0, 0);

        if (texture1)
        {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texture1);
            gl.uniform1i(this.program.uTexture1, 1);
        }

        if (texture2)
        {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, texture2);
            gl.uniform1i(this.program.uTexture2, 2);
        }

        if (texture3)
        {
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, texture3);
            gl.uniform1i(this.program.uTexture3, 3);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.fullScreenQuad, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.program.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(this.program.aPos);

        if (this.targetTexture)
        {
            gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    }

    drawLineTexture(xPoints, yPoints, mainGain) {
        console.log('drawLineTexture');
        this.fadeAmount = Math.pow(0.5, this.persistence) * 0.2 * this.bufferSize/512 ;
        this.activateTargetTexture(this.lineTexture);
        this.fade();
        //gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawLine(xPoints, yPoints, mainGain);
        gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    drawLine(xPoints, yPoints, mainGain) {
        console.log('drawLine');
        this.setAdditiveBlending();

        const scratchVertices = this.scratchVertices;
        //this.totalLength = 0;
        const nPoints = xPoints.length;
        for (let i = 0; i < nPoints; i++)
        {
            const p = i * 8;
            scratchVertices[p] = scratchVertices[p+2] = scratchVertices[p+4] = scratchVertices[p+6] = xPoints[i];
            scratchVertices[p+1] = scratchVertices[p+3] = scratchVertices[p+5] = scratchVertices[p+7] = yPoints[i];
            /*if (i>0)
            {
                var xDelta = xPoints[i]-xPoints[i-1];
                if (xDelta<0) xDelta = -xDelta;
                var yDelta = yPoints[i]-yPoints[i-1];
                if (yDelta<0) yDelta = -yDelta;
                this.totalLength += xDelta + yDelta;
            }*/
        }
        //testOutputElement.value = this.totalLength;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, scratchVertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const program = this.lineShader;
        gl.useProgram(program);
        gl.enableVertexAttribArray(program.aStart);
        gl.enableVertexAttribArray(program.aEnd);
        gl.enableVertexAttribArray(program.aIdx);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(program.aStart, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(program.aEnd, 2, gl.FLOAT, false, 0, 8*4);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadIndexBuffer);
        gl.vertexAttribPointer(program.aIdx, 1, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
        gl.uniform1i(program.uScreen, 0);

        gl.uniform1f(program.uSize, 0.015);
        gl.uniform1f(program.uGain, Math.pow(2.0,mainGain)*480/512);
        //if (controls.invertXY) gl.uniform1f(program.uInvert, -1.0);
        /*else*/ gl.uniform1f(program.uInvert, 1.0);
        //if (controls.disableFilter) gl.uniform1f(program.uIntensity, 0.005*(this.filterSteps+1.5));
        // +1.5 needed above for some reason for the brightness to match
        /*else*/ gl.uniform1f(program.uIntensity, 0.005);
        gl.uniform1f(program.uFadeAmount, this.fadeAmount);
        gl.uniform1f(program.uNEdges, this.nEdges);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
        const nEdgesThisTime = (xPoints.length-1);

        /*if (this.totalLength > 300)
        {
            nEdgesThisTime *= 300/this.totalLength;
            nEdgesThisTime = Math.floor(nEdgesThisTime);
        }*/

        gl.drawElements(gl.TRIANGLES, nEdgesThisTime * 6, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(program.aStart);
        gl.disableVertexAttribArray(program.aEnd);
        gl.disableVertexAttribArray(program.aIdx);
    }

    fade(alpha) {
        console.log('fade');
        this.setNormalBlending();

        const program = this.simpleShader;
        gl.useProgram(program);
        gl.enableVertexAttribArray(program.vertexPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.fullScreenQuad, gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.uniform4fv(program.colour, [0.0, 0.0, 0.0, this.fadeAmount]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(program.vertexPosition);
    }

    setAdditiveBlending() {
        console.log('setAdditiveBlending');
        //gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.ONE, gl.ONE);
    }

    setNormalBlending() {
        console.log('setNormalBlending');
        //gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    /*
        callback from SoundwaveProcessor
     */
    draw(data) {
        return;
        console.log('draw', Object.keys(data));
        const { xSamples, ySamples, mainGain } = data;
        if (xSamples && ySamples) {
            this.drawLineTexture(xSamples, ySamples, mainGain);
        }
    }
}