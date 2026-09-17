// Generates the PWA app icons from the brand mark — a five-axis radar
// pentagon with a copper shape inside, on the paper palette.
// Run: npx tsx scripts/generate-icons.ts
import { writeFileSync } from "node:fs"
import sharp from "sharp"
import { axisAngle, pointAt, toSvgPoints } from "../lib/radar"

const SIZE = 512
const CENTER = SIZE / 2

const INK = {
  bg: "#F4EDE3", // paper
  ring: "#D9C7B3", // hairline
  spoke: "#D9C7B3",
  polygon: "#B5683A", // copper
  polygonStroke: "#8F4E28", // copper-700
}

const ring = (radius: number): string =>
  toSvgPoints(
    Array.from({ length: 5 }, (_, i) => pointAt(radius, axisAngle(i, 5), CENTER, CENTER)),
  )

const spokes = Array.from({ length: 5 }, (_, i) => {
  const p = pointAt(200, axisAngle(i, 5), CENTER, CENTER)
  return `<line x1="${CENTER}" y1="${CENTER}" x2="${p.x}" y2="${p.y}" stroke="${INK.spoke}" stroke-width="6"/>`
}).join("\n    ")

// A deliberately asymmetric café shape — the mark's copper blob.
const radarPolygon = toSvgPoints(
  [5, 3.5, 2.2, 4, 4.5].map((v, i) =>
    pointAt((v / 5) * 200, axisAngle(i, 5), CENTER, CENTER),
  ),
)

function brandSvg(scale: number): string {
  const transform = `transform="translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${INK.bg}"/>
  <g ${transform}>
    ${spokes}
    ${[200, 132, 64]
      .map((r) => `<polygon points="${ring(r)}" fill="none" stroke="${INK.ring}" stroke-width="${r === 200 ? 9 : 6}"/>`)
      .join("\n    ")}
    <polygon points="${radarPolygon}" fill="${INK.polygon}" fill-opacity="0.25" stroke="${INK.polygonStroke}" stroke-width="14" stroke-linejoin="round"/>
  </g>
</svg>`
}

async function render(svg: string, size: number, file: string): Promise<void> {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
  console.log(`wrote ${file} (${size}x${size})`)
}

// Minimal .ico: PNG payload inside an ICO container (valid since Vista).
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // count
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0) // width (256 → 0)
  entry.writeUInt8(size, 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(png.length, 8) // payload size
  entry.writeUInt32LE(22, 12) // payload offset
  return Buffer.concat([header, entry, png])
}

async function main() {
  const regular = brandSvg(1)
  const maskable = brandSvg(0.92) // content inside the maskable safe zone
  await render(regular, 192, "public/icon-192.png")
  await render(regular, 512, "public/icon-512.png")
  await render(maskable, 512, "public/icon-maskable-512.png")
  await render(regular, 180, "public/apple-touch-icon.png")
  writeFileSync("public/icon.svg", brandSvg(1))
  console.log("wrote public/icon.svg (source)")
  const faviconPng = await sharp(Buffer.from(regular)).resize(32, 32).png().toBuffer()
  writeFileSync("app/favicon.ico", pngToIco(faviconPng, 32))
  console.log("wrote app/favicon.ico (32x32 PNG-in-ICO)")
}

main().catch((err) => {
  console.error("ICON GENERATION FAILED:", err)
  process.exit(1)
})
