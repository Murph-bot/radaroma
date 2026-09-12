// Generates the PWA app icons from the brand SVG (radar chart + coffee cup
// in the coffee palette, using the same radar geometry as the site).
// Run: npx tsx scripts/generate-icons.ts
import { writeFileSync } from "node:fs"
import sharp from "sharp"
import { axisAngle, pointAt, toSvgPoints } from "../lib/radar"

const SIZE = 512
const CENTER = SIZE / 2

const COFFEE = {
  bg: "#FAF6F0",
  ring: "#E6D7C3",
  polygon: "#B08968",
  polygonStroke: "#86684C",
  cupStroke: "#463523",
  cupFill: "#FAF6F0",
  coffeeFill: "#6E543E",
  steam: "#A07F5F",
}

const ring = (radius: number): string =>
  toSvgPoints(
    Array.from({ length: 5 }, (_, i) => pointAt(radius, axisAngle(i, 5), CENTER, CENTER)),
  )

// Radar polygon with a realistic café-ish profile
const radarPolygon = toSvgPoints(
  [5, 4, 3, 4.5, 5].map((v, i) =>
    pointAt((v / 5) * 190, axisAngle(i, 5), CENTER, CENTER),
  ),
)

function brandSvg(scale: number): string {
  const transform = `transform="translate(${CENTER} ${CENTER}) scale(${scale}) translate(${-CENTER} ${-CENTER})"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${COFFEE.bg}"/>
  <g ${transform}>
    ${[190, 128, 66]
      .map((r) => `<polygon points="${ring(r)}" fill="none" stroke="${COFFEE.ring}" stroke-width="${r === 190 ? 10 : 7}"/>`)
      .join("\n    ")}
    <polygon points="${radarPolygon}" fill="${COFFEE.polygon}" fill-opacity="0.8" stroke="${COFFEE.polygonStroke}" stroke-width="13" stroke-linejoin="round"/>
    <path d="M 216 206 C 204 186 228 176 216 154" fill="none" stroke="${COFFEE.steam}" stroke-width="12" stroke-linecap="round"/>
    <path d="M 296 206 C 284 186 308 176 296 154" fill="none" stroke="${COFFEE.steam}" stroke-width="12" stroke-linecap="round"/>
    <path d="M 326 256 C 372 256 372 330 326 330" fill="none" stroke="${COFFEE.cupStroke}" stroke-width="10" stroke-linecap="round"/>
    <rect x="186" y="236" width="140" height="112" rx="16" fill="${COFFEE.cupFill}" stroke="${COFFEE.cupStroke}" stroke-width="10"/>
    <rect x="196" y="248" width="120" height="36" rx="10" fill="${COFFEE.coffeeFill}"/>
    <ellipse cx="256" cy="372" rx="100" ry="15" fill="none" stroke="${COFFEE.cupStroke}" stroke-width="9"/>
  </g>
</svg>`
}

async function render(svg: string, size: number, file: string): Promise<void> {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
  console.log(`wrote ${file} (${size}x${size})`)
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
}

main().catch((err) => {
  console.error("ICON GENERATION FAILED:", err)
  process.exit(1)
})
