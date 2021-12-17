export const vertex = `
    attribute vec2 vertexPosition;
    void main()
    {
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`

export const fragment = `
    precision highp float;
    uniform vec4 colour;
    void main()
    {
        gl_FragColor = colour;
    }
`

/* The Gaussian line-drawing code, the next two shaders, is adapted
from woscope by m1el : https://github.com/m1el/woscope */

export const gaussianVertex = `
    #define EPS 1E-6
    uniform float uInvert;
    uniform float uSize;
    uniform float uNEdges;
    uniform float uFadeAmount;
    uniform float uIntensity;
    uniform float uGain;
    attribute vec2 aStart, aEnd;
    attribute float aIdx;
    varying vec4 uvl;
    varying vec2 vTexCoord;
    varying float vLen;
    varying float vSize;
    void main () {
        float tang;
        vec2 current;
        // All points in quad contain the same data:
        // segment start point and segment end point.
        // We determine point position using its index.
        float idx = mod(aIdx,4.0);
    
        // 'dir' vector is storing the normalized difference
        // between end and start
        vec2 dir = (aEnd-aStart)*uGain;
        uvl.z = length(dir);
    
        if (uvl.z > EPS)
        {
            dir = dir / uvl.z;
            vSize = 0.006/pow(uvl.z,0.08);
        }
        else
        {
            // If the segment is too short, just draw a square
            dir = vec2(1.0, 0.0);
            vSize = 0.006/pow(EPS,0.08);
        }
    
        vSize = uSize;
        vec2 norm = vec2(-dir.y, dir.x);
    
        if (idx >= 2.0) 
        {
            current = aEnd*uGain;
            tang = 1.0;
            uvl.x = -vSize;
        } 
        else 
        {
            current = aStart*uGain;
            tang = -1.0;
            uvl.x = uvl.z + vSize;
        }
        // 'side' corresponds to shift to the "right" or "left"
        float side = (mod(idx, 2.0)-0.5)*2.0;
        uvl.y = side * vSize;
    
        uvl.w = uIntensity*mix(1.0-uFadeAmount, 1.0, floor(aIdx / 4.0 + 0.5)/uNEdges);
    
        vec4 pos = vec4((current+(tang*dir+norm*side)*vSize)*uInvert,0.0,1.0);
        gl_Position = pos;
        vTexCoord = 0.5*pos.xy+0.5;
        //float seed = floor(aIdx/4.0);
        //seed = mod(sin(seed*seed), 7.0);
        //if (mod(seed/2.0, 1.0)<0.5) gl_Position = vec4(10.0);
    }
`

export const gaussianFragment = `
    #define EPS 1E-6
    #define TAU 6.283185307179586
    #define TAUR 2.5066282746310002
    #define SQRT2 1.4142135623730951
    precision highp float;
    uniform float uSize;
    uniform float uIntensity;
    uniform sampler2D uScreen;
    varying float vSize;
    varying vec4 uvl;
    varying vec2 vTexCoord;

    // A standard gaussian function, used for weighting samples
    float gaussian(float x, float sigma)
    {
        return exp(-(x * x) / (2.0 * sigma * sigma)) / (TAUR * sigma);
    }

    // This approximates the error function, needed for the gaussian integral
    float erf(float x)
    {
        float s = sign(x), a = abs(x);
        x = 1.0 + (0.278393 + (0.230389 + 0.078108 * (a * a)) * a) * a;
        x *= x;
        return s - s / (x * x);
    }

    void main (void)
    {
        float len = uvl.z;
        vec2 xy = uvl.xy;
        float brightness;

        float sigma = vSize/5.0;
        if (len < EPS)
        {
            // If the beam segment is too short, just calculate intensity at the position.
            brightness = gaussian(length(xy), sigma);
        }
        else
        {
            // Otherwise, use analytical integral for accumulated intensity.
            brightness = erf(xy.x/SQRT2/sigma) - erf((xy.x-len)/SQRT2/sigma);
            brightness *= exp(-xy.y*xy.y/(2.0*sigma*sigma))/2.0/len;
        }

        brightness *= uvl.w;
        gl_FragColor = 2.0 * texture2D(uScreen, vTexCoord) * brightness;
        gl_FragColor.a = 1.0;
    }
`

export const texturedVertex = `
    precision highp float;
    attribute vec2 aPos;
    varying vec2 vTexCoord;
    void main (void)
    {
        gl_Position = vec4(aPos, 0.0, 1.0);
        vTexCoord = (0.5*aPos+0.5);
    }
`

export const texturedVertexWithResize = `
    precision highp float;
    attribute vec2 aPos;
    varying vec2 vTexCoord;
    uniform float uResizeForCanvas;
    void main (void)
    {
        gl_Position = vec4(aPos, 0.0, 1.0);
        vTexCoord = (0.5*aPos+0.5)*uResizeForCanvas;
    }
`

export const texturedFragment = `
    precision highp float;
    uniform sampler2D uTexture0;
    varying vec2 vTexCoord;
    void main (void)
    {
        gl_FragColor = texture2D(uTexture0, vTexCoord);
        gl_FragColor.a= 1.0;
    }
`

export const blurFragment = `
    precision highp float;
    uniform sampler2D uTexture0;
    uniform vec2 uOffset;
    varying vec2 vTexCoord;
    void main (void)
    {
        vec4 sum = vec4(0.0);
        sum += texture2D(uTexture0, vTexCoord - uOffset*8.0) * 0.000078;
        sum += texture2D(uTexture0, vTexCoord - uOffset*7.0) * 0.000489;
        sum += texture2D(uTexture0, vTexCoord - uOffset*6.0) * 0.002403;
        sum += texture2D(uTexture0, vTexCoord - uOffset*5.0) * 0.009245;
        sum += texture2D(uTexture0, vTexCoord - uOffset*4.0) * 0.027835;
        sum += texture2D(uTexture0, vTexCoord - uOffset*3.0) * 0.065592;
        sum += texture2D(uTexture0, vTexCoord - uOffset*2.0) * 0.12098;
        sum += texture2D(uTexture0, vTexCoord - uOffset*1.0) * 0.17467;
        sum += texture2D(uTexture0, vTexCoord + uOffset*0.0) * 0.19742;
        sum += texture2D(uTexture0, vTexCoord + uOffset*1.0) * 0.17467;
        sum += texture2D(uTexture0, vTexCoord + uOffset*2.0) * 0.12098;
        sum += texture2D(uTexture0, vTexCoord + uOffset*3.0) * 0.065592;
        sum += texture2D(uTexture0, vTexCoord + uOffset*4.0) * 0.027835;
        sum += texture2D(uTexture0, vTexCoord + uOffset*5.0) * 0.009245;
        sum += texture2D(uTexture0, vTexCoord + uOffset*6.0) * 0.002403;
        sum += texture2D(uTexture0, vTexCoord + uOffset*7.0) * 0.000489;
        sum += texture2D(uTexture0, vTexCoord + uOffset*8.0) * 0.000078;
        gl_FragColor = sum;
    }
`

export const outputVertex = `
    precision highp float;
    attribute vec2 aPos;
    varying vec2 vTexCoord;
    varying vec2 vTexCoordCanvas;
    uniform float uResizeForCanvas;
    void main (void)
    {
        gl_Position = vec4(aPos, 0.0, 1.0);
        vTexCoord = (0.5*aPos+0.5);
        vTexCoordCanvas = vTexCoord*uResizeForCanvas;
    }
`

export const outputFragment = `
    precision highp float;
    uniform sampler2D uTexture0; //line
    uniform sampler2D uTexture1; //tight glow
    uniform sampler2D uTexture2; //big glow
    uniform sampler2D uTexture3; //screen
    uniform float uExposure;
    uniform float graticuleLight;
    uniform vec3 uColour;
    varying vec2 vTexCoord;
    varying vec2 vTexCoordCanvas;
    void main (void)
    {
        vec4 line = texture2D(uTexture0, vTexCoordCanvas);
        // r components have grid; g components do not.
        vec4 screen = texture2D(uTexture3, vTexCoord);
        vec4 tightGlow = texture2D(uTexture1, vTexCoord);
        vec4 scatter = texture2D(uTexture2, vTexCoord)+0.35;
        float light = line.r + 1.5*screen.g*screen.g*tightGlow.r;
        light += 0.4*scatter.g * (2.0+1.0*screen.g + 0.5*screen.r);
        float tlight = 1.0-pow(2.0, -uExposure*light);
        float tlight2 = tlight*tlight*tlight;
        gl_FragColor.rgb = mix(uColour, vec3(1.0), 0.3+tlight2*tlight2*0.5)*tlight;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, (vec3(0.7)+0.3*uColour)*screen.b, graticuleLight);
        //gl_FragColor.rgb += 0.4*(vec3(0.7)+0.3*uColour)*screen.b;
        gl_FragColor.a= 1.0;
    }
`