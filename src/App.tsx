import React, { useEffect, useRef } from 'react';

import fragmentShader from "./main.fs";
import vertexShader from "./main.vs";

import './App.css';

const _vertexShader = [
  "attribute vec2 a_position;",
  "uniform vec2 u_resolution;",
  "void main() {",
  "vec2 zeroToOne = a_position / u_resolution;",
  "vec2 zeroToTwo = zeroToOne * 2.0;",
  "vec2 clipSpace = zeroToTwo - 1.0;",
  "gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
  "}"
].join("\n");

const _fragmentShader = [
  "precision mediump float;",
  "uniform vec4 u_color;",
  "void main() {",
  "gl_FragColor = u_color;",
  "}"
].join("\n");


const setRectangle = (gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) => {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  // ПРИМ.: gl.bufferData(gl.ARRAY_BUFFER, ...) воздействует
  // на буфер, который привязан к точке привязке `ARRAY_BUFFER`,
  // но таким образом у нас будет один буфер. Если бы нам понадобилось
  // несколько буферов, нам бы потребовалось привязать их сначала к `ARRAY_BUFFER`.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW);
}

const resizeCanvas = (canvas: HTMLCanvasElement) => {
  // получаем размер HTML-элемента canvas
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // проверяем, отличается ли размер canvas
  if (canvas.width !== displayWidth ||
    canvas.height !== displayHeight) {

    // подгоняем размер буфера отрисовки под размер HTML-элемента
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);

  if (!shader) return;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (success)
    return shader;


  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);

}

const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
  const program = gl.createProgram();

  if (!program) return;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (success)
    return program;

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}



function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef || !canvasRef.current) return;

    const gl = canvasRef.current.getContext("webgl");
    if (!gl) {
      console.error("webgl does not support");
      return;
    }

    canvasRef.current.height = gl.canvas.height;
    canvasRef.current.width = gl.canvas.width;

    console.log((vertexShader as string));

    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, _fragmentShader);

    if (!vShader || !fShader) return;

    const program = createProgram(gl, vShader, fShader);

    if (!program) return;

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const colorUniformLocation = gl.getUniformLocation(program, "u_color");

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    resizeCanvas(canvasRef.current);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
    const size = 2;          // 2 компоненты на итерацию
    const type = gl.FLOAT;   // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    const stride = 0;        // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const offset = 0;        // начинать с начала буфера

    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    const primitiveType = gl.TRIANGLES;
    const _offset = 0;
    const count = 6;

    setRectangle(gl, gl.canvas.width/2 - 150, gl.canvas.height/2 - 125, 300, 250);

    // задаём случайный цвет
    gl.uniform4f(colorUniformLocation, -1, -1, -1, 1);

    // отрисовка прямоугольника
    gl.drawArrays(primitiveType, _offset, count);



  }, []);

  return (

    <canvas ref={canvasRef}></canvas>
  );
}

export default App;
