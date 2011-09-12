/**
 * WebGL sprite.js backend experiement
 *
 * Based on the work of Arno van der Vegt, 2011, legoasimo@gmail.com
 *
 * Licence:  
 * Creative Commons Attribution/Share-Alike license
 * http://creativecommons.org/licenses/by-sa/3.0/
 *
 * The WebGL setup code was provided by: http://learningwebgl.com
**/
(function(global){

var mvMatrix      = mat4.create(),
    mvMatrixStack = [],
    pMatrix       = mat4.create(),
    bitmap,            // Bitmap texture and buffers
    bitmapX  = 0,      // Bitmap x position
    bitmapY  = 0,      // Bitmap y position
    stepX    = 0.2,    // Horizontal step, direction
    stepY    = 0.1,    // Vertical step, direction
    lastTime = 0;

function initGL(canvas) {
    try {
        var gl = canvas.getContext('experimental-webgl');
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    }
    catch (e) {
    }
    if (!gl) {
        alert('Could not initialise WebGL, sorry :-(');
    }
    return gl;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var shader,
        str = '',
        k   = shaderScript.firstChild;

    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    if (shaderScript.type == 'x-shader/x-fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type == 'x-shader/x-vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(gl) {
    var fragmentShader = getShader(gl, 'shader-fs');
    var vertexShader = getShader(gl, 'shader-vs');

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Could not initialise shaders');
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, 'uPMatrix');
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix');
    shaderProgram.nMatrixUniform  = gl.getUniformLocation(shaderProgram, 'uNMatrix');
    shaderProgram.samplerUniform  = gl.getUniformLocation(shaderProgram, 'uSampler');
    
    gl.shaderProgram = shaderProgram;
}

function Texture(sprite) {
    this.gl = sprite.layer.ctx;
    var gl = this.gl;
    this.img = sprite.img;
    this.sprite = sprite;
    this.width = this.img.width;
    this.height = this.img.height;
    
    // init stuff
    this.createTexture(gl);
    this.createBuffers(gl);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);
    gl.vertexAttribPointer(gl.shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glTextureCoordBuffer);
    gl.vertexAttribPointer(gl.shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);    
    
}

Texture.prototype.createTexture = function(gl) {
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);        
};

Texture.prototype.createBuffers = function createBuffers(gl) {
    var vertices = [0.0,   0.0,    0.0,
                    this.width, 0.0,    0.0,
                    0.0,   this.height, 0.0,
                    this.width, this.height, 0.0];

    this.glPositionBuffer = gl.createBuffer();        
    this.gl.bindBuffer(gl.ARRAY_BUFFER, this.glPositionBuffer);        
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.glPositionBuffer.numItems = 4;

    var w             = 1,
        h             = 1,
        textureCoords = [0.0, 0.0,
                         w,   0.0,
                         0.0, h,
                         w,   h];
    
    this.glTextureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(gl.ARRAY_BUFFER, this.glTextureCoordBuffer);
    this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    this.glTextureCoordBuffer.numItems = 4;        
};


Texture.prototype.render = function render() {
    var gl = this.gl;    
    this.matrix();
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.glPositionBuffer.numItems); 
};


Texture.prototype.matrix = function matrix() {
    var gl = this.gl; 
    //pMatrix  = mat4.ortho(0, this.gl.viewportWidth, this.gl.viewportHeight, 0, 0.001, 100000);
    mvMatrix = mat4.identity(mat4.create());

    mat4.translate(mvMatrix, [this.sprite.x, this.sprite.y, 0]);
    if(this.sprite.angle != 0)
        mat4.rotate(mvMatrix, this.sprite.angle, [0, 0, 1]);
    
    // send the stuff to the graphic card
    //gl.uniformMatrix4fv(gl.shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(gl.shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function init(canvas) {
    var gl = initGL(canvas);
    initShaders(gl);
    gl.clearColor(1.0, 1.0, 1.0, 0.0);
    gl.clearStencil(128);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA  );
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    pMatrix  = mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, 0.001, 100000);
    gl.uniformMatrix4fv(gl.shaderProgram.pMatrixUniform, false, pMatrix);
    mvMatrix = mat4.identity(mat4.create());
    
    return gl;
}

window.webgl = {
    init:init,
    Texture:Texture
}

})(this);