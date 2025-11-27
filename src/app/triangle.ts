"use client";

type Mat4 = Float32Array;

function mat4Identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    const ai0 = a[i];
    const ai1 = a[i + 4];
    const ai2 = a[i + 8];
    const ai3 = a[i + 12];
    out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
    out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
    out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
    out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
  }
  return out;
}

function mat4Perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1.0 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mat4Translation(tx: number, ty: number, tz: number): Mat4 {
  const out = mat4Identity();
  out[12] = tx;
  out[13] = ty;
  out[14] = tz;
  return out;
}

function mat4RotateY(rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function mat4RotateX(rad: number): Mat4 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

export async function renderTriangle(canvas: HTMLCanvasElement): Promise<() => void> {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    console.warn("WebGPU not supported in this browser");
    return () => {};
  }

  const context = canvas.getContext("webgpu");
  if (!context) {
    console.warn("Unable to acquire a WebGPU context from the canvas");
    return () => {};
  }

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const baseCssWidth = canvas.clientWidth || Number(canvas.getAttribute("width")) || 200;
  const baseCssHeight = canvas.clientHeight || Number(canvas.getAttribute("height")) || 173;
  if (!canvas.style.width) {
    canvas.style.width = `${baseCssWidth}px`;
  }
  if (!canvas.style.height) {
    canvas.style.height = `${baseCssHeight}px`;
  }

  let configuredWidth = 0;
  let configuredHeight = 0;

  const configureContext = () => {
    const cssWidth = canvas.clientWidth || baseCssWidth;
    const cssHeight = canvas.clientHeight || baseCssHeight;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));

    if (width !== configuredWidth || height !== configuredHeight) {
      canvas.width = width;
      canvas.height = height;
      context.configure({
        device,
        format: presentationFormat,
        alphaMode: "premultiplied", // allow underlying page background to show through
      });
      configuredWidth = width;
      configuredHeight = height;
      createDepthTexture(width, height);
    }
  };

  let depthTexture: GPUTexture | null = null;
  const createDepthTexture = (width: number, height: number) => {
    depthTexture?.destroy();
    depthTexture = device.createTexture({
      size: [width, height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  };

  configureContext();

  const vertexData = new Float32Array([
    // position              // color
    0.0, 0.85, 0.0, 0.0, 0.3, 1.0, // apex (cool blue)
    -0.7, -0.6, -0.7, 1.0, 0.2, 0.2, // base front-left (red-ish)
    0.7, -0.6, -0.7, 0.2, 1.0, 0.2, // base front-right (green-ish)
    0.7, -0.6, 0.7, 1.0, 1.0, 0.2, // base back-right (yellow-ish)
    -0.7, -0.6, 0.7, 0.6, 0.3, 1.0, // base back-left (violet-ish)
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
  vertexBuffer.unmap();

  const indexData = new Uint16Array([
    // sides (CCW)
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 1,
    // base (two triangles, CCW when looking down)
    1, 4, 3,
    1, 3, 2,
  ]);

  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(indexData);
  indexBuffer.unmap();

  const uniformBuffer = device.createBuffer({
    size: 64, // 4x4 matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const shaderModule = device.createShaderModule({
    label: "pyramid-shader",
    code: /* wgsl */ `
      struct Uniforms {
        mvp : mat4x4<f32>,
      };

      @group(0) @binding(0) var<uniform> uniforms : Uniforms;

      struct VertexInput {
        @location(0) position : vec3<f32>,
        @location(1) color : vec3<f32>,
      };

      struct VertexOutput {
        @builtin(position) position : vec4<f32>,
        @location(0) color : vec3<f32>,
      };

      @vertex
      fn vs(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.mvp * vec4<f32>(input.position, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
        return vec4<f32>(input.color, 1.0);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "pyramid",
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 6 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
            { shaderLocation: 1, offset: 3 * 4, format: "float32x3" }, // color
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "back",
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: undefined as unknown as GPUTextureView, // set each frame
        clearValue: [0, 0, 0, 0],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };

  const computeMvp = (time: number) => {
    const aspect = canvas.width / canvas.height;
    const projection = mat4Perspective(Math.PI / 3, aspect, 0.1, 10);
    const view = mat4Translation(0, 0, -2.6);
    const rotationY = mat4RotateY(time * 0.8);
    const model = rotationY;
    const viewModel = mat4Multiply(view, model);
    return mat4Multiply(projection, viewModel);
  };

  let frameId: number | undefined;
  const render = (now: number) => {
    configureContext();

    const mvp = computeMvp(now / 1000);
    device.queue.writeBuffer(uniformBuffer, 0, mvp.buffer, mvp.byteOffset, mvp.byteLength);

    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    renderPassDescriptor.depthStencilAttachment!.view = depthTexture!.createView();

    const encoder = device.createCommandEncoder({ label: "pyramid-encoder" });
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, uniformBindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint16");
    pass.drawIndexed(indexData.length);
    pass.end();

    device.queue.submit([encoder.finish()]);
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);

  return () => {
    if (frameId !== undefined) cancelAnimationFrame(frameId);
    depthTexture?.destroy();
  };
}
