'use client'

import type React from "react"

import { forwardRef, useImperativeHandle, useEffect, useRef, useMemo, type FC, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"
import { ArrowRight, LogIn, Star, FileText, Globe, Users, BarChart3, CheckCircle, Mail, MapPin, Phone, Send, MessageCircle, ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"

// ============================================================================
// BEAMS COMPONENT (3D Background)
// ============================================================================

type UniformValue = THREE.IUniform<unknown> | unknown

interface ExtendMaterialConfig {
  header: string
  vertexHeader?: string
  fragmentHeader?: string
  material?: THREE.MeshPhysicalMaterialParameters & { fog?: boolean }
  uniforms?: Record<string, UniformValue>
  vertex?: Record<string, string>
  fragment?: Record<string, string>
}

type ShaderWithDefines = THREE.ShaderLibShader & {
  defines?: Record<string, string | number | boolean>
}

function extendMaterial<T extends THREE.Material = THREE.Material>(
  BaseMaterial: new (params?: THREE.MaterialParameters) => T,
  cfg: ExtendMaterialConfig,
): THREE.ShaderMaterial {
  const physical = THREE.ShaderLib.physical as ShaderWithDefines
  const { vertexShader: baseVert, fragmentShader: baseFrag, uniforms: baseUniforms } = physical
  const baseDefines = physical.defines ?? {}

  const uniforms: Record<string, THREE.IUniform> = THREE.UniformsUtils.clone(baseUniforms)

  const defaults = new BaseMaterial(cfg.material || {}) as T & {
    color?: THREE.Color
    roughness?: number
    metalness?: number
    envMap?: THREE.Texture
    envMapIntensity?: number
  }

  if (defaults.color) uniforms.diffuse.value = defaults.color
  if ("roughness" in defaults) uniforms.roughness.value = defaults.roughness
  if ("metalness" in defaults) uniforms.metalness.value = defaults.metalness
  if ("envMap" in defaults) uniforms.envMap.value = defaults.envMap
  if ("envMapIntensity" in defaults) uniforms.envMapIntensity.value = defaults.envMapIntensity

  Object.entries(cfg.uniforms ?? {}).forEach(([key, u]) => {
    uniforms[key] =
      u !== null && typeof u === "object" && "value" in u
        ? (u as THREE.IUniform<unknown>)
        : ({ value: u } as THREE.IUniform<unknown>)
  })

  let vert = `${cfg.header}\n${cfg.vertexHeader ?? ""}\n${baseVert}`
  let frag = `${cfg.header}\n${cfg.fragmentHeader ?? ""}\n${baseFrag}`

  for (const [inc, code] of Object.entries(cfg.vertex ?? {})) {
    vert = vert.replace(inc, `${inc}\n${code}`)
  }

  for (const [inc, code] of Object.entries(cfg.fragment ?? {})) {
    frag = frag.replace(inc, `${inc}\n${code}`)
  }

  const mat = new THREE.ShaderMaterial({
    defines: { ...baseDefines },
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    lights: true,
    fog: !!cfg.material?.fog,
  })

  return mat
}

const CanvasWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <Canvas dpr={[1, 2]} frameloop="always" className="w-full h-full relative">
    {children}
  </Canvas>
)

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "")
  const r = Number.parseInt(clean.substring(0, 2), 16)
  const g = Number.parseInt(clean.substring(2, 4), 16)
  const b = Number.parseInt(clean.substring(4, 6), 16)
  return [r / 255, g / 255, b / 255]
}

const noise = `
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`

interface BeamsProps {
  beamWidth?: number
  beamHeight?: number
  beamNumber?: number
  lightColor?: string
  speed?: number
  noiseIntensity?: number
  scale?: number
  rotation?: number
}

function createStackedPlanesBufferGeometry(
  n: number,
  width: number,
  height: number,
  spacing: number,
  heightSegments: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const numVertices = n * (heightSegments + 1) * 2
  const numFaces = n * heightSegments * 2

  const positions = new Float32Array(numVertices * 3)
  const indices = new Uint32Array(numFaces * 3)
  const uvs = new Float32Array(numVertices * 2)

  let vertexOffset = 0
  let indexOffset = 0
  let uvOffset = 0

  const totalWidth = n * width + (n - 1) * spacing
  const xOffsetBase = -totalWidth / 2

  for (let i = 0; i < n; i++) {
    const xOffset = xOffsetBase + i * (width + spacing)
    const uvXOffset = Math.random() * 300
    const uvYOffset = Math.random() * 300

    for (let j = 0; j <= heightSegments; j++) {
      const y = height * (j / heightSegments - 0.5)
      const v0 = [xOffset, y, 0]
      const v1 = [xOffset + width, y, 0]

      positions.set([...v0, ...v1], vertexOffset * 3)

      const uvY = j / heightSegments
      uvs.set([uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset], uvOffset)

      if (j < heightSegments) {
        const a = vertexOffset,
          b = vertexOffset + 1,
          c = vertexOffset + 2,
          d = vertexOffset + 3
        indices.set([a, b, c, c, b, d], indexOffset)
        indexOffset += 6
      }

      vertexOffset += 2
      uvOffset += 4
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()

  return geometry
}

const MergedPlanes = forwardRef<
  THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  {
    material: THREE.ShaderMaterial
    width: number
    count: number
    height: number
  }
>(({ material, width, count, height }, ref) => {
  const mesh = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null!)

  useImperativeHandle(ref, () => mesh.current)

  const geometry = useMemo(
    () => createStackedPlanesBufferGeometry(count, width, height, 0, 100),
    [count, width, height],
  )

  useFrame((_, delta) => {
    mesh.current.material.uniforms.time.value += 0.1 * delta
  })

  return <mesh ref={mesh} geometry={geometry} material={material} />
})

MergedPlanes.displayName = "MergedPlanes"

const PlaneNoise = forwardRef<
  THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>,
  {
    material: THREE.ShaderMaterial
    width: number
    count: number
    height: number
  }
>((props, ref) => (
  <MergedPlanes ref={ref} material={props.material} width={props.width} count={props.count} height={props.height} />
))

PlaneNoise.displayName = "PlaneNoise"

const DirLight: FC<{ position: [number, number, number]; color: string }> = ({ position, color }) => {
  const dir = useRef<THREE.DirectionalLight>(null!)

  useEffect(() => {
    if (!dir.current) return
    const cam = dir.current.shadow.camera as THREE.Camera & {
      top: number
      bottom: number
      left: number
      right: number
      far: number
    }
    cam.top = 24
    cam.bottom = -24
    cam.left = -24
    cam.right = 24
    cam.far = 64
    dir.current.shadow.bias = -0.004
  }, [])

  return <directionalLight ref={dir} color={color} intensity={1} position={position} />
}

const Beams: FC<BeamsProps> = ({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = "#ffffff",
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
}) => {
  const meshRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null!)

  const beamMaterial = useMemo(
    () =>
      extendMaterial(THREE.MeshStandardMaterial, {
        header: `
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${noise}`,
        vertexHeader: `
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }

  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }

  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,
        fragmentHeader: "",
        vertex: {
          "#include <begin_vertex>": `transformed.z += getPos(transformed.xyz);`,
          "#include <beginnormal_vertex>": `objectNormal = getNormal(position.xyz);`,
        },
        fragment: {
          "#include <dithering_fragment>": `
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`,
        },
        material: { fog: true },
        uniforms: {
          diffuse: new THREE.Color(...hexToNormalizedRGB("#000000")),
          time: { shared: true, mixed: true, linked: true, value: 0 },
          roughness: 0.3,
          metalness: 0.3,
          uSpeed: { shared: true, mixed: true, linked: true, value: speed },
          envMapIntensity: 10,
          uNoiseIntensity: noiseIntensity,
          uScale: scale,
        },
      }),
    [speed, noiseIntensity, scale],
  )

  return (
    <CanvasWrapper>
      <group rotation={[0, 0, degToRad(rotation)]}>
        <PlaneNoise ref={meshRef} material={beamMaterial} count={beamNumber} width={beamWidth} height={beamHeight} />
        <DirLight color={lightColor} position={[0, 3, 10]} />
      </group>
      <ambientLight intensity={1} />
      <color attach="background" args={["#000000"]} />
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={30} />
    </CanvasWrapper>
  )
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "lg"
  children: React.ReactNode
}

const Button = ({ variant = "default", size = "sm", className = "", children, ...props }: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-white text-black hover:bg-gray-100",
    outline: "border border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30",
    ghost: "text-white/90 hover:text-white hover:bg-white/10",
  }

  const sizes = {
    sm: "h-9 px-4 py-2 text-sm",
    lg: "px-8 py-6 text-lg",
  }

  return (
    <button
      className={`group relative overflow-hidden rounded-full ${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center">{children}</span>
      <div className="absolute inset-0 -top-2 -bottom-2 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
    </button>
  )
}

// ============================================================================
// MAIN HERO COMPONENT
// ============================================================================

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
]

const platformFeatures = [
  { icon: FileText, title: "Export-Ready Quotes", desc: "Generate professional, structured quotations for international buyers in minutes." },
  { icon: Globe, title: "Global Currencies", desc: "Price in any currency with live FX rates, buffers, and multi-currency breakdowns." },
  { icon: Users, title: "Buyer–Supplier CRM", desc: "Manage relationships, certifications, and export capabilities in one place." },
  { icon: BarChart3, title: "Cost Analytics", desc: "Full visibility into margins, landed costs, and per-unit profitability." },
]

const steps = [
  { step: "01", title: "Add Your Products", desc: "Build your product catalog with base costs, units, and specifications." },
  { step: "02", title: "Configure a Quote", desc: "Select buyers, apply currency, margins, freight, and duties automatically." },
  { step: "03", title: "Review & Export", desc: "Generate a professional PDF quotation ready to share with buyers." },
  { step: "04", title: "Track & Close", desc: "Monitor quote status, buyer responses, and convert to confirmed orders." },
]

const CONTACT = {
  email:    "contact@flourishhigh.com",
  phoneIN:  "+91 9131230076",
  phoneNZ:  "+64 220856514",
  whatsapp: "919131230076",
  address:  "Bhopal (MP), India — 462024",
}
const waUrl = `https://wa.me/${CONTACT.whatsapp}?text=Hello%2C%20I%27m%20interested%20in%20the%20FHI%20Platform.`

const FOOTER_NAV    = ["Platform", "How It Works", "Pricing", "Contact", "Login"]
const FOOTER_FEATS  = ["Quote Builder", "Buyer CRM", "Cost Analytics", "Multi-Currency", "PDF Export"]

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

export default function EtherealBeamsHero() {
  const router = useRouter()
  return (
    <div className="w-full bg-black">

      {/* ── Hero ── */}
      <div className="relative min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Beams beamWidth={2.5} beamHeight={18} beamNumber={15} lightColor="#ffffff" speed={2.5} noiseIntensity={2} scale={0.15} rotation={43} />
        </div>

        {/* Sticky Navbar */}
        <nav className="sticky top-0 z-50 w-full">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Logo — left */}
              <a href="/" className="flex items-center" aria-label="FHI home">
                <div className="relative h-20 w-20 shrink-0">
                  <Image src="/fhi-logo.png" alt="Flourish High International" fill sizes="80px" className="object-contain" priority />
                </div>
              </a>

              {/* Nav pills — absolutely centered */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 p-1">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:text-white">
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Auth — right */}
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => router.push('/login')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Button>
                <Button size="sm" onClick={() => router.push('/register')}>
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 inline-flex items-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 text-sm text-white/90">
                <Star className="mr-2 h-4 w-4 text-white" />
                Export Trade Platform
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Trade smarter.
                <br />
                <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Quote faster.
                </span>
              </h1>

              <p className="mb-10 text-lg leading-8 text-white/80 sm:text-xl lg:text-2xl max-w-3xl mx-auto">
                Flourish High International — a unified platform for export costing,
                quotation management, and buyer–supplier CRM.
              </p>

              <div className="flex items-center justify-center mb-12">
                <Button size="lg" className="shadow-2xl shadow-white/25 font-semibold px-16" onClick={() => window.open('https://flourish-high.vercel.app/', '_blank')}>
                  About FHI
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
                {[
                  { value: "500+", label: "Quotes Generated" },
                  { value: "40+", label: "Countries Served" },
                  { value: "200+", label: "Active Buyers" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">{s.value}</div>
                    <div className="text-white/60 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-0 bg-linear-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* ── Platform ── */}
      <section id="platform" className="py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-14"
          >
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "#D4A853" }}>
              // Platform
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-1.5px" }}>
              Everything your<br />trade team needs.
            </h2>
            <p className="text-white/50 text-base max-w-lg">One platform for the entire export lifecycle — from costing to closing.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-yellow-600/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-5" style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "#D4A853" }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-14"
          >
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "#D4A853" }}>
              // How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-1.5px" }}>
              From product to<br />quotation in four steps.
            </h2>
            <p className="text-white/50 text-base max-w-lg">A streamlined workflow designed for export teams — no spreadsheets required.</p>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px" style={{ background: "rgba(212,168,83,0.15)" }} />
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10" style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.25)" }}>
                  <span className="text-sm font-mono font-semibold" style={{ color: "#D4A853" }}>{item.step}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-14"
          >
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "#D4A853" }}>
              // Pricing
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: "-1.5px" }}>
              Tailored for<br />trade teams.
            </h2>
            <p className="text-white/50 text-base max-w-lg">FHI is built for export-focused businesses. Pricing is scoped to your team size and trade volume.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            viewport={{ once: true }}
            className="max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10"
            style={{ borderColor: "rgba(212,168,83,0.15)" }}
          >
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium mb-6" style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.25)", color: "#D4A853" }}>
              Enterprise
            </div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: "-0.5px" }}>Custom pricing, no surprises</h3>
            <p className="text-white/50 text-sm mb-8 max-w-sm">We scope every deployment to the team's exact needs. Reach out and we'll put together a plan.</p>
            <ul className="space-y-3 mb-10 max-w-xs">
              {["Unlimited quotes & buyers", "Multi-currency support", "Priority onboarding", "Dedicated account support"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#D4A853" }} />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/register')}
              className="inline-flex items-center gap-2 px-10 py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "#1E3A5F", border: "1px solid rgba(212,168,83,0.3)" }}
            >
              Request Pricing
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 px-6 md:px-16 lg:px-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-14"
          >
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "#D4A853" }}>
              // Get in Touch
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight" style={{ letterSpacing: "-1.5px" }}>
              Start your<br />trade journey.
            </h2>
          </motion.div>

          {/* Two-col layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

            {/* Left: contact info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col gap-6"
            >
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Whether you&apos;re looking to source agricultural commodities, establish an import
                channel, or explore our platform — we&apos;re ready to talk.
              </p>

              <div className="flex flex-col gap-4">
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-white/70" />
                  </div>
                  {CONTACT.email}
                </a>

                <a href={`tel:${CONTACT.phoneIN.replace(/\s/g, "")}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-white/70" />
                  </div>
                  <span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}>IN</span>
                    {CONTACT.phoneIN}
                  </span>
                </a>

                <a href={`tel:${CONTACT.phoneNZ.replace(/\s/g, "")}`} className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-white/70" />
                  </div>
                  <span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded mr-1.5 font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}>NZ</span>
                    {CONTACT.phoneNZ}
                  </span>
                </a>

                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-white/70" />
                  </div>
                  {CONTACT.address}
                </div>
              </div>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-85 mt-2 w-fit"
                style={{ background: "#1E3A5F", border: "1px solid rgba(212,168,83,0.25)" }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </motion.div>

            {/* Right: inquiry form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6" style={{ letterSpacing: "-0.5px" }}>
                Request a Demo
              </h3>
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="Full Name *" required autoComplete="name"
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <input
                    type="email" placeholder="Email Address *" required autoComplete="email"
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <input
                    type="text" placeholder="Company Name" autoComplete="organization"
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <input
                    type="text" placeholder="Country *" required autoComplete="country-name"
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <textarea
                  rows={4} placeholder="Tell us about your requirements..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 mt-1"
                  style={{ background: "#1E3A5F", border: "1px solid rgba(212,168,83,0.3)" }}
                >
                  Send Inquiry <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-6 md:px-16 lg:px-20 py-16" style={{ background: "#050505" }}>
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-11 w-11 shrink-0">
                <Image src="/fhi-logo.png" alt="Flourish High International" fill sizes="44px" className="object-contain" />
              </div>
              <div>
                <p className="font-bold text-white text-base leading-none">Flourish High</p>
                <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "#D4A853" }}>International</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-55 mt-4">
              India-based International Trading Company. Quality commodities, globally traded.
            </p>
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#D4A853" }}>
                Connect with us
              </p>
              <div className="flex gap-3">
                <a
                  href="https://linkedin.com/company/flourish-high-international"
                  target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-white/50 hover:text-white transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
                >
                  <LinkedInIcon />
                  <span className="text-[11px]">LinkedIn</span>
                </a>
                <a
                  href="https://instagram.com/flourishhighinternational"
                  target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-white/50 hover:text-white transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
                >
                  <InstagramIcon />
                  <span className="text-[11px]">Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Navigate */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#D4A853" }}>Navigate</p>
            {FOOTER_NAV.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
                className="block text-sm text-white/50 hover:text-white mb-2 transition-colors">
                {l}
              </a>
            ))}
          </div>

          {/* Col 3: Features */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#D4A853" }}>Features</p>
            {FOOTER_FEATS.map((l) => (
              <span key={l} className="block text-sm text-white/50 mb-2">{l}</span>
            ))}
          </div>

          {/* Col 4: Contact */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#D4A853" }}>Contact</p>
            <a href={`mailto:${CONTACT.email}`} className="block text-sm text-white/50 hover:text-white mb-3 transition-colors">
              {CONTACT.email}
            </a>
            <div className="flex flex-col gap-2 mb-3">
              <a href={`tel:${CONTACT.phoneIN.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}>IN</span>
                {CONTACT.phoneIN}
              </a>
              <a href={`tel:${CONTACT.phoneNZ.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(212,168,83,0.15)", color: "#D4A853" }}>NZ</span>
                {CONTACT.phoneNZ}
              </a>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">{CONTACT.address}</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto max-w-7xl mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Flourish High International. All rights reserved.</p>
          <p className="text-xs text-white/20 tracking-widest uppercase">Export · Quote · Grow</p>
        </div>
      </footer>

    </div>
  )
}
