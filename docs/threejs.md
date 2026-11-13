# three.js — referência para o Muvi

Lido em 13/11/2026 de threejs.org/docs e threejs.org/manual. Versão atual: **r187** (`three@0.187.0`). Grátis (licença MIT).

O que foi lido: o índice completo da documentação (cerca de 1.900 páginas de API, agrupadas por categoria), o manual (lista de artigos e "Fundamentals"/"Installation") e o código-fonte dos geradores procedurais. As páginas de API individuais não foram lidas uma a uma; a maioria é referência de classe (propriedades e métodos), para consultar quando precisar.

## Instalação sem build (igual ao Muvi)

```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/",
  "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.webgpu.js",
  "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.tsl.js"
} }</script>
<script type="module">import * as THREE from 'three';</script>
```
Atenção: o Muvi hoje é um script clássico concatenado. three.js é **módulo ES**; carregar com `import()` dinâmico e guardar em `window.THREE`.

## Conceitos (Fundamentals)

Renderer (desenha no canvas) + Scene (árvore de objetos, fundo, neblina) + Camera (`PerspectiveCamera(fov, aspect, near, far)` ou `OrthographicCamera`) + Mesh (Geometry + Material) + Light. `renderer.render(scene, camera)` desenha um quadro.

```js
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(1080, 1920, false);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1080/1920, .1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2), new THREE.DirectionalLight(0xffffff, 2));
const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: 0x356cff }));
scene.add(box);
// no Muvi: a cada quadro do vídeo
function draw3D(ctx, t) { box.rotation.y = t; renderer.render(scene, camera); ctx.drawImage(renderer.domElement, 0, 0); }
```
Para o Muvi o essencial: **sem requestAnimationFrame** — renderizar só quando o `drawFrame` pedir, com o tempo do vídeo (artigo "Rendering On Demand"). `preserveDrawingBuffer: true` ou desenhar logo após o `render()` para copiar o quadro ("Taking a screenshot"). `alpha: true` para sobrepor ao cenário 2D ("Make the Canvas Transparent").

## Mapa da documentação (categorias)

- **Núcleo**: Object3D, BufferGeometry, Raycaster, Clock/Timer, RenderTarget, Layers.
- **Animação**: AnimationMixer, AnimationClip, KeyframeTracks (anima modelos .glb com ossos), SkinnedMesh, CCDIKSolver (cinemática inversa).
- **Câmeras**: Perspective, Orthographic, Cube, Stereo, Array.
- **Geometrias**: Box, Sphere, Plane, Cylinder, Torus, Shape/Extrude, Text (TextGeometry com FontLoader), RoundedBox, Decal, Loft, Convex.
- **Materiais**: Basic, Lambert, Phong, Standard/Physical (PBR), Toon (visual cartoon), Sprite, Points, Line, Shader; e os NodeMaterials (TSL) do WebGPU.
- **Luzes**: Ambient, Hemisphere, Directional, Point, Spot, RectArea, LightProbe; sombras (CSM para cenas grandes).
- **Loaders**: GLTF/GLB (formato recomendado), FBX, OBJ, DRACO (compressão), KTX2, HDR/EXR (iluminação de ambiente), SVGLoader (transforma SVG em formas 3D), FontLoader, LUT (gradação de cor).
- **Pós-processamento**: EffectComposer + passes — UnrealBloom (brilho), Bokeh (desfoque de profundidade), Film (grão), Glitch, Halftone, Outline, SSAO/GTAO (sombra de contato), LUTPass, Afterimage, RenderTransitionPass (transição entre cenas), FXAA/SMAA.
- **Objetos prontos**: Sky, Water, Reflector (espelho), Lensflare, GroundedSkybox, GaussianSplat.
- **Geradores procedurais (novos)**: City, Skyscraper, Car (sedã, táxi…), Person (multidão low-poly andando ou parada), Tree, Forest, Terrain, Streetlight, Trafficlight, Bench, Hydrant, Trashcan, Sidewalk. **Exigem `three/webgpu` + TSL** (WebGPURenderer, que cai para WebGL2 quando não há WebGPU).
- **Controles**: OrbitControls, TransformControls, DragControls etc. (para editor 3D, não para vídeo).
- **Renderizadores extras**: CSS2D/CSS3D (HTML em 3D), SVGRenderer.
- **Exportadores**: GLTF, OBJ, STL, USDZ (AR do iPhone).
- **Física**: Ammo, Jolt, Rapier.
- **Outros**: TSL (linguagem de shader em JS), WebXR (VR/AR), Inspector, utilitários de geometria e esqueleto.

## Manual — artigos úteis para o Muvi

Rendering On Demand · Taking a screenshot · Make the Canvas Transparent · Using A Canvas for Dynamic Textures (desenhar nosso canvas 2D como textura num plano 3D) · Post Processing · Loading 3D Models / Load a .GLTF file · Add a Background or Skybox · How to Draw Transparent Objects · Multiple Canvases, Multiple Scenes · Using OffscreenCanvas in a Web Worker · Optimizing Lots of Objects · Freeing Resources / How to dispose of Objects · Color Management · Billboards and Facades · Shadows · Fog.

## Cuidados

- iPhone: WebGL2 funciona; WebGPU só em versões recentes do Safari — usar WebGL como padrão.
- Memória: liberar com `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.dispose()` ao trocar de projeto.
- Peso: o three.js tem ~700 KB; carregar só quando a cena 3D for usada.
