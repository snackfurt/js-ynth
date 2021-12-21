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
var create3DContext = function(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var i= 0; i < names.length; ++i) {
        try {
            context = canvas.getContext(names[i], opt_attribs);
        } catch(e) {}
        if (context) {
            break;
        }
    }
    return context;
}
var gl;
var n;
var a_position;
var a_pointSize;
var u_fragColor;
var loadShader = function(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    console.log( type, compiled);
    return shader;
}
var initVertexBuffers = function(gl){
    var verticies = new Float32Array([
            0.0, 0.0
        ]),
        n = 1,
        vertexBuffer = gl.createBuffer();
    if(!vertexBuffer) {
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticies, gl.STATIC_DRAW);
    var a_position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0,0);
    gl.enableVertexAttribArray(a_position);
    return n;
}
var main = function(){
    console.log('main')
    var canvas = document.getElementById('example');
    canvas.width = 800;
    canvas.height = 800;
    gl = create3DContext(canvas);
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    console.log(linked);
    gl.useProgram(program);
    gl.program = program;
    n = initVertexBuffers(gl);
    a_pointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    u_fragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_fragColor, 1.0, 0.0,0.0,1.0);
    gl.vertexAttrib1f(a_pointSize, 10.0);
    render();
}
function render() {
    requestAnimationFrame(render);
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, n);
}

export {
    main,
}