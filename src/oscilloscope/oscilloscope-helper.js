import * as shaderSources from './shader-sources';

export function createShader(gl, vertexShader, fragmentShader)
{
    const vsSource = shaderSources[vertexShader];
    const fsSource = shaderSources[fragmentShader];

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    {
        const infoLog = gl.getShaderInfoLog(vs);
        gl.deleteShader(vs);
        throw new Error('createShader, vertex shader compilation:\n' + infoLog);
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
    {
        const infoLog = gl.getShaderInfoLog(fs);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        throw new Error('createShader, fragment shader compilation:\n' + infoLog);
    }

    const program = gl.createProgram();

    gl.attachShader(program, vs);
    gl.deleteShader(vs);

    gl.attachShader(program, fs);
    gl.deleteShader(fs);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        const infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('createShader, linking:\n' + infoLog);
    }

    return program;
}

export function makeTexture(gl, width, height)
{
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, Render.ext.HALF_FLOAT_OES, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    texture.width = width;
    texture.height = height;
    return texture;
}

export function getColourFromHue(hue)
{
    const alpha = (hue/120.0) % 1.0;
    const start = Math.sqrt(1.0-alpha);
    const end = Math.sqrt(alpha);
    let colour;
    if (hue<120) colour = [start, end, 0.0];
    else if (hue<240) colour = [0.0, start, end];
    else colour = [end, 0.0, start];

    return colour;
}