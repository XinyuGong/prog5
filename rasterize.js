/* assignment specific globals */
var eye = vec3.fromValues(0, 0, 2.5); // default eye position in world space
var lookAt = vec3.fromValues(0, 0, -1);
var lookUp = vec3.fromValues(0, 1, 0);
var light = vec3.fromValues(0, 0, 4);

/* webgl globals */
var interval = 100;
var gl = null; // the all powerful gl object. It's all here folks!
var vertexPositionAttrib; // where to put position for vertex shader
var normalAttrib;
var mAmbientLoc;
var mDiffuseLoc;
var mSpecularLoc;
var lightLoc;
var eyeLoc;
var nLoc;
var projectionLoc;
var viewMatLoc;
var transferMatLoc;
var basicCube = {
    'vertices': new Float32Array([
        0,0,0,      0,0,0.1,        0.1,0,0.1,      0.1,0,0,
        0.1,0,0,    0.1,0,0.1,      0.1,0.1,0.1,    0.1,0.1,0,
        0.1,0.1,0,  0.1,0.1,0.1,    0,0.1,0.1,      0,0.1,0,
        0,0.1,0,    0,0.1,0.1,      0,0,0.1,        0,0,0,
        0,0,0,      0.1,0,0,        0.1,0.1,0,      0,0.1,0,
        0,0,0.1,    0,0.1,0.1,      0.1,0.1,0.1,    0.1,0,0.1
    ]),
    'normalList': new Float32Array([
        0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
        1,0,0,  1,0,0,  1,0,0,  1,0,0,
        0,1,0,  0,1,0,  0,1,0,  0,1,0,
        -1,0,0, -1,0,0, -1,0,0, -1,0,0,
        0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
        0,0,1,  0,0,1,  0,0,1,  0,0,1
    ]),
    'triangles': new Uint16Array([
        0,1,2,      2,3,0,
        4,5,6,      6,7,4,
        8,9,10,     10,11,8,
        12,13,14,   14,15,12,
        16,17,18,   18,19,16,
        20,21,22,   22,23,20
    ]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var groundPlane = {
    'vertices': new Float32Array([-2,-2,0, 2,-2,0, 2,2,0, -2,2,0]),
    'normalList': new Float32Array([0,0,1, 0,0,1, 0,0,1, 0,0,1]),
    'triangles': new Uint16Array([0,3,2, 0,2,1]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var leftWall = {
    'vertices': new Float32Array([-2,-2,0, -2,2,0, -2,2,10, -2,-2,10]),
    'normalList': new Float32Array([1,0,0, 1,0,0, 1,0,0, 1,0,0]),
    'triangles': new Uint16Array([0,3,2, 0,2,1]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var rightWall = {
    'vertices': new Float32Array([2,-2,0, 2,2,0, 2,2,10, 2,-2,10]),
    'normalList': new Float32Array([-1,0,0, -1,0,0, -1,0,0, -1,0,0]),
    'triangles': new Uint16Array([0,1,2, 0,2,3]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var upWall = {
    'vertices': new Float32Array([-2,2,0, 2,2,0, 2,2,10, -2,2,10]),
    'normalList': new Float32Array([0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0]),
    'triangles': new Uint16Array([0,3,2, 0,2,1]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var downWall = {
    'vertices': new Float32Array([-2,-2,0, 2,-2,0, 2,-2,10, -2,-2,10]),
    'normalList': new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0]),
    'triangles': new Uint16Array([0,1,2, 0,2,3]),
    'vertexBuffer': undefined,
    'triBuffer': undefined,
    'normalBuffer': undefined
};
var basicModels = [basicCube, groundPlane, leftWall, rightWall, upWall, downWall];
var snake;
var snakeAI;
var foodPos = [0, 0];

function resetSnake() {
    snake = {
        'color': [0.6, 0, 0],
        'body': [[0, 0], [-1, 0], [-2, 0], [-3, 0]],
        'dir': 3, // 0-up, 1-down, 2-left, 3-right
        'nextDir': 3,
        'grow': false
    };
}

function resetSnakeAI() {
    snakeAI = {
        'color': [0, 0, 0.6],
        'body': [[0, 10], [-1, 10], [-2, 10], [-3, 10]],
        'dir': 3, // 0-up, 1-down, 2-left, 3-right
        'nextDir': 3,
        'grow': false
    };
}

function loadBasicModels() {
    for (var i = 0; i < basicModels.length; i ++) {
        var model = basicModels[i];
        model.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);
        model.triBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.triBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.triangles, gl.STATIC_DRAW);
        model.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.normalList, gl.STATIC_DRAW);
    }
}

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        uniform vec3 mAmbient, mDiffuse, mSpecular, lightPos, eyePos;
        uniform float n;
        varying vec3 v_vertexPos, v_normal;
        void main(void) {
            vec3 normal = normalize(v_normal);
            vec3 lightDir = normalize(lightPos - v_vertexPos);          
            float lambertian = max(dot(lightDir, normal), 0.0);
            float specular = 0.0;
            if (lambertian > 0.0) {
                vec3 viewDir = normalize(eyePos - v_vertexPos);
                
                // blinn phone:
                vec3 halfDir = normalize(lightDir + viewDir);
                float specAngle = max(dot(halfDir, normal), 0.0);
                specular = pow(specAngle, n);
            }
            //gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
            gl_FragColor = vec4(mAmbient + lambertian * mDiffuse + specular * mSpecular, 1.0);
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 vertexPosition, a_normal;
        varying vec3 v_normal, v_vertexPos;
        uniform mat4 projection, viewMatrix, transferMatrix;
        void main(void) {
            v_normal = a_normal;
            v_vertexPos = vec3(transferMatrix * vec4(vertexPosition, 1.0));
            //gl_Position = vec4(vertexPosition, 1.0);
            gl_Position = projection * viewMatrix * (transferMatrix * vec4(vertexPosition, 1.0));
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.enable(gl.DEPTH_TEST);
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                normalAttrib = gl.getAttribLocation(shaderProgram, "a_normal");
                gl.enableVertexAttribArray(normalAttrib);
                projectionLoc = gl.getUniformLocation(shaderProgram, 'projection');
                viewMatLoc = gl.getUniformLocation(shaderProgram, 'viewMatrix');
                mAmbientLoc = gl.getUniformLocation(shaderProgram, 'mAmbient');
                mDiffuseLoc = gl.getUniformLocation(shaderProgram, 'mDiffuse');
                mSpecularLoc = gl.getUniformLocation(shaderProgram, 'mSpecular');
                nLoc = gl.getUniformLocation(shaderProgram, 'n');
                eyeLoc = gl.getUniformLocation(shaderProgram, 'eyePos');
                lightLoc = gl.getUniformLocation(shaderProgram, 'lightPos');
                transferMatLoc = gl.getUniformLocation(shaderProgram, 'transferMatrix');
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

function renderTriangles() {
    for (var i = 0; i < models.length; i ++) {
        var model = models[i];
        // transformation
        model.transform = mat4.create();
        mat4.mul(model.transform, model.scaleMat, model.transform);
        mat4.mul(model.transform, model.rotatMat, model.transform);
        mat4.mul(model.transform, model.transMat, model.transform);
    }
    renderOrder.sort(compare);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    // Enable alpha blending and set the percentage blending factors
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderModels(true);
    renderModels(false);
}

function setProjection() {
    var projectionMat = mat4.create();
    var viewMat = mat4.create();
    var focal = vec3.create();
    vec3.add(focal, eye, lookAt);
    mat4.lookAt(viewMat, eye, focal, lookUp);
    gl.uniformMatrix4fv(viewMatLoc, false, viewMat);
    mat4.perspective(projectionMat, Math.PI/2, 1, 0.5, 10);
    gl.uniformMatrix4fv(projectionLoc, false, projectionMat);
    gl.uniform3fv(eyeLoc, eye);
}

function renderEnv() {
    gl.uniformMatrix4fv(transferMatLoc, false, mat4.create()); // no transformations needed for environment
    gl.uniform3fv(mSpecularLoc, vec3.fromValues(0.2, 0.2, 0.2));
    gl.uniform1f(nLoc, 5);
    gl.uniform3fv(lightLoc, light);
    for (var i = 1; i < basicModels.length; i ++) {
        var model = basicModels[i];
        gl.bindBuffer(gl.ARRAY_BUFFER,model.vertexBuffer);
        gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER,model.normalBuffer);
        gl.vertexAttribPointer(normalAttrib,3,gl.FLOAT,false,0,0);
        if (i == 1) {
            gl.uniform3fv(mAmbientLoc, vec3.fromValues(0, 0.1, 0)); // green ground
            gl.uniform3fv(mDiffuseLoc, vec3.fromValues(0, 0.4, 0));
        } else {
            gl.uniform3fv(mAmbientLoc, vec3.fromValues(0.1, 0.1, 0.1)); // gray walls
            gl.uniform3fv(mDiffuseLoc, vec3.fromValues(0.5, 0.5, 0.5));
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.triBuffer);
        gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
    }
}

function renderFood() {
    var transferMatrix = mat4.create();
    var transVec = vec3.fromValues(foodPos[0]*0.1, foodPos[1]*0.1, 0);
    gl.uniformMatrix4fv(transferMatLoc, false, mat4.fromTranslation(transferMatrix, transVec));
    gl.bindBuffer(gl.ARRAY_BUFFER, basicCube.vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, basicCube.normalBuffer);
    gl.vertexAttribPointer(normalAttrib,3,gl.FLOAT,false,0,0);
    gl.uniform3fv(mAmbientLoc, vec3.fromValues(0.1, 0.1, 0)); // yellow food
    gl.uniform3fv(mDiffuseLoc, vec3.fromValues(0.4, 0.4, 0));
    gl.uniform3fv(mSpecularLoc, vec3.fromValues(0.2, 0.2, 0.2));
    gl.uniform1f(nLoc, 5);
    gl.uniform3fv(lightLoc, light);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basicCube.triBuffer);
    gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0);
}

function renderSnake(snake) {
    var color = snake.color;
    gl.bindBuffer(gl.ARRAY_BUFFER, basicCube.vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, basicCube.normalBuffer);
    gl.vertexAttribPointer(normalAttrib,3,gl.FLOAT,false,0,0);
    gl.uniform3fv(mAmbientLoc, vec3.fromValues(0.1*color[0], 0.1*color[1], 0.1*color[2]));
    gl.uniform3fv(mDiffuseLoc, vec3.fromValues(color[0], color[1], color[2]));
    gl.uniform3fv(mSpecularLoc, vec3.fromValues(0.2, 0.2, 0.2));
    gl.uniform1f(nLoc, 5);
    gl.uniform3fv(lightLoc, light);
    for (var i = 0; i < snake.body.length; i ++) {
        var transferMatrix = mat4.create();
        var transVec = vec3.fromValues(snake.body[i][0]*0.1, snake.body[i][1]*0.1, 0);
        gl.uniformMatrix4fv(transferMatLoc, false, mat4.fromTranslation(transferMatrix, transVec));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, basicCube.triBuffer);
        gl.drawElements(gl.TRIANGLES,36,gl.UNSIGNED_SHORT,0);
    }
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    setProjection();
    renderEnv();
    renderFood();
    renderSnake(snake);
    renderSnake(snakeAI);
}

function moveSnake(snake) {
    if (snake.grow) {
        snake.grow = false;
        snake.body.push([0, 0]);
    }
    for (var i = snake.body.length - 1; i > 0; i --) {
        snake.body[i][0] = snake.body[i - 1][0];
        snake.body[i][1] = snake.body[i - 1][1];
    }
    switch (snake.nextDir) {
        case 0: snake.body[0] = [snake.body[0][0], snake.body[0][1] + 1]; break; // up
        case 1: snake.body[0] = [snake.body[0][0], snake.body[0][1] - 1]; break; // down
        case 2: snake.body[0] = [snake.body[0][0] - 1, snake.body[0][1]]; break; // left
        case 3: snake.body[0] = [snake.body[0][0] + 1, snake.body[0][1]]; break; // right
    }
    snake.dir = snake.nextDir;
}

function spawnFood() {
    var x = Math.floor(Math.random() * 40) - 20;
    var y = Math.floor(Math.random() * 40) - 20;
    while (true) {
        var valid = true;
        for (var i = 0; i < snake.body.length; i++) {
            if (snake.body[i][0] == x && snake.body[i][1] == y) {
                valid = false;
                break;
            }
        }
        if (valid) break;
        x = Math.floor(Math.random() * 40) - 20;
        y = Math.floor(Math.random() * 40) - 20;
    }
    foodPos = [x, y];
}

function checkHitFood(snake) {
    if (snake.body[0][0] == foodPos[0] && snake.body[0][1] == foodPos[1]) {
        snake.grow = true;
        spawnFood();
    }
}

function checkHitWall(snake) {
    return (snake.body[0][0] > 19 || snake.body[0][0] < -20 || snake.body[0][1] > 19 || snake.body[0][1] < -20);
}

function checkHitSelf(snake) {
    for (var i = 1; i < snake.body.length; i++) {
        if (snake.body[i][0] == snake.body[0][0] && snake.body[i][1] == snake.body[0][1]) {
            return true;
        }
    }
    return false;
}

function checkHitOther(snake1, snake2) {
    for (var i = 1; i < snake2.body.length; i++) {
        if (snake2.body[i][0] == snake1.body[0][0] && snake2.body[i][1] == snake1.body[0][1]) {
            return true;
        }
    }
    return false;
}

function randomlyMove() {
    var nextDir = Math.floor(Math.random()*4);
    switch (nextDir) {
        case 0: if (snakeAI.dir != 1) snakeAI.nextDir = 0; break;
        case 1: if (snakeAI.dir != 0) snakeAI.nextDir = 1; break;
        case 2: if (snakeAI.dir != 3) snakeAI.nextDir = 2; break;
        case 3: if (snakeAI.dir != 2) snakeAI.nextDir = 3; break;
    }
}

// keyboard handler
function keyDownHandler(event) {
    switch(event.key) {
        case 'a': if (snake.dir != 3) snake.nextDir = 2; break;
        case 'd': if (snake.dir != 2) snake.nextDir = 3; break;
        case 'w': if (snake.dir != 1) snake.nextDir = 0; break;
        case 's': if (snake.dir != 0) snake.nextDir = 1; break;
        case 'A': if (snake.dir != 3) snake.nextDir = 2; break;
        case 'D': if (snake.dir != 2) snake.nextDir = 3; break;
        case 'W': if (snake.dir != 1) snake.nextDir = 0; break;
        case 'S': if (snake.dir != 0) snake.nextDir = 1; break;
    }
    renderScene();
}

function transX(amount) { // move right if amount > 0
    var right = new vec3.create();
    vec3.cross(right, lookAt, lookUp);
    vec3.normalize(right, right);
    
    var trans = new vec3.create();
    vec3.scale(trans, right, amount);
    vec3.add(eye, eye, trans);
}

/* MAIN -- HERE is where execution begins after window load */

function main() {
    setupWebGL(); // set up the webGL environment
    loadBasicModels(); // load in the triangles from tri file
    setupShaders(); // setup the webGL shaders
    document.addEventListener('keydown', keyDownHandler, false);
    resetSnake();
    resetSnakeAI();
    spawnFood();
    var loop = setInterval(
        function() {
            randomlyMove();
            moveSnake(snake);
            moveSnake(snakeAI);
            checkHitFood(snake);
            checkHitFood(snakeAI);
            var isDead = false, isDeadAI = false;
            if (checkHitSelf(snake) || checkHitWall(snake) || checkHitOther(snake, snakeAI)) {
                isDead = true;
            }
            if (checkHitSelf(snakeAI) || checkHitWall(snakeAI) || checkHitOther(snakeAI, snake)) {
                isDeadAI = true;
            }
            if (isDead) resetSnake();
            if (isDeadAI) resetSnakeAI();
            renderScene();
        }, interval
    );
} // end main
