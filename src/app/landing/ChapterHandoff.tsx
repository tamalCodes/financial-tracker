"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import styles from "./landing.module.css";

type ChapterHandoffProps = { children: ReactNode };

const vertexShader = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uProgress;
  uniform float uEnergy;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(17.2, 9.4);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv - 0.5;
    p.x *= uResolution.x / max(uResolution.y, 1.0);
    float time = uTime * 0.055;
    float field = fbm(p * 1.45 + vec2(time, -time * 0.62));
    float wave = sin(p.x * 2.4 + field * 4.1 + uProgress * 1.7) * 0.065;
    wave += sin(p.x * 5.7 - time * 1.8) * 0.016;
    float seam = abs(p.y - wave + 0.12 - uProgress * 0.16);
    float refraction = smoothstep(0.24, 0.0, seam) * (0.34 + field * 0.66);
    float flare = smoothstep(0.085 + uEnergy * 0.035, 0.0, seam);
    float vignette = smoothstep(0.92, 0.16, length(p * vec2(0.72, 1.0)));
    vec3 charcoal = vec3(0.129, 0.110, 0.082);
    vec3 warmShadow = vec3(0.185, 0.137, 0.071);
    vec3 gold = vec3(0.745, 0.541, 0.235);
    vec3 colour = mix(charcoal, warmShadow, field * 0.24 * vignette);
    colour += gold * refraction * (0.075 + uEnergy * 0.075);
    colour += gold * flare * (0.055 + uEnergy * 0.12);
    colour *= 0.82 + vignette * 0.18;
    gl_FragColor = vec4(colour, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function ChapterHandoff({ children }: ChapterHandoffProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "high-performance" });
    if (!gl) return;
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    const resolution = gl.getUniformLocation(program, "uResolution");
    const time = gl.getUniformLocation(program, "uTime");
    const progress = gl.getUniformLocation(program, "uProgress");
    const energy = gl.getUniformLocation(program, "uEnergy");
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastProgress = 0;
    let smoothedEnergy = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 800 ? 1.15 : 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    const render = (now: number) => {
      resize();
      const scrollProgress = Number.parseFloat(host.style.getPropertyValue("--handoff-progress")) || 0;
      const targetEnergy = Math.min(Math.abs(scrollProgress - lastProgress) * 110, 1);
      lastProgress = scrollProgress;
      smoothedEnergy += (targetEnergy - smoothedEnergy) * (targetEnergy > smoothedEnergy ? 0.22 : 0.055);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, now * 0.001);
      gl.uniform1f(progress, scrollProgress);
      gl.uniform1f(energy, smoothedEnergy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    render(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <div className={styles.chapterHandoff} data-chapter-handoff ref={hostRef}>
      <div className={styles.chapterBackdrop} data-chapter-backdrop data-nav-tone="dark">
        <canvas className={styles.chapterCanvas} ref={canvasRef} aria-hidden="true" />
        <div className={styles.chapterAura} aria-hidden="true" />
        <div className={styles.chapterContent} data-chapter-content>
          <span className={styles.eyebrow}><i /> FROM SIGNAL TO STORY</span>
          <h3>What you know<br /><em>becomes what you choose.</em></h3>
          <div className={styles.chapterMeasures} aria-label="Kharcha clarity loop">
            <span><small>01</small> Balance <b>seen</b></span>
            <span><small>02</small> Spending <b>understood</b></span>
            <span><small>03</small> Next move <b>chosen</b></span>
          </div>
        </div>
        <div className={styles.chapterMonogram} aria-hidden="true">₹</div>
      </div>
      <div className={styles.chapterForeground} data-chapter-foreground>{children}</div>
    </div>
  );
}
