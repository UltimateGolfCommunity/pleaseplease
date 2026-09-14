import { mkdir, copyFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import sharp from 'sharp'

const appRoot = path.resolve(import.meta.dirname, '..')
const sourceRoot = path.join(appRoot, 'app-store-screenshots', '2026-09-09', 'current-ugc-screens')
const outputRoot = path.join(appRoot, 'app-store-screenshots', '2026-09-09', 'iphone-65-promotional')
const backdrop = '/Users/lukerestall/.codex/generated_images/01a07815-1c0b-7373-ad4b-cc394422edcc/exec-9baacb35-4a6a-40ef-859d-7aae6e5eeefe.png'
const canvas = { width: 1284, height: 2778 }

const screens = [
  { input: '01-home.png', output: '01-your-private-club.png', eyebrow: 'ULTIMATE GOLF COMMUNITY', headline: 'YOUR PRIVATE CLUB,\nWHEREVER YOU PLAY', subhead: 'Build your local golf community.' },
  { input: '02-profile.png', output: '02-your-golf-profile.png', eyebrow: 'YOUR GOLF IDENTITY', headline: 'A PROFILE\nWORTHY OF THE CLUB', subhead: 'Show your game. Grow your network.' },
  { input: '03-crossville-scores.png', output: '03-tournaments-made-social.png', eyebrow: 'PLAY TOGETHER', headline: 'CREATE\nTHE TOURNAMENT.\nOWN THE MOMENT.', subhead: 'Score every match. Follow every point.' },
  { input: '04-member-card.png', output: '04-share-your-golf-identity.png', eyebrow: 'YOUR MEMBER CARD', headline: 'SHARE YOUR\nGOLF IDENTITY', subhead: 'One scan. Your complete golf profile.' }
]

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function textSvg({ eyebrow, headline, subhead }) {
  const headlineLines = headline.split('\n')
  const isThreeLineHeadline = headlineLines.length > 2
  const headlineStart = isThreeLineHeadline ? 220 : 264
  const headlineSpacing = isThreeLineHeadline ? 100 : 126
  const subheadY = headlineStart + headlineLines.length * headlineSpacing + (isThreeLineHeadline ? 62 : 72)
  const headlineMarkup = headlineLines
    .map((line, index) => `<text x="642" y="${headlineStart + index * headlineSpacing}" text-anchor="middle" class="headline">${escapeXml(line)}</text>`)
    .join('')

  return Buffer.from(`
    <svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d3558" stop-opacity="0.72"/>
          <stop offset="0.40" stop-color="#0b2b42" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#071b17" stop-opacity="0.40"/>
        </linearGradient>
        <linearGradient id="caption" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#051f31" stop-opacity="0.45"/>
          <stop offset="1" stop-color="#051f31" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1284" height="2778" fill="url(#wash)"/>
      <rect width="1284" height="720" fill="url(#caption)"/>
      <text x="642" y="118" text-anchor="middle" class="eyebrow">${escapeXml(eyebrow)}</text>
      ${headlineMarkup}
      <text x="642" y="${subheadY}" text-anchor="middle" class="subhead">${escapeXml(subhead)}</text>
      <style>
        .eyebrow { fill: #f6dc91; font: 800 27px Arial, Helvetica, sans-serif; letter-spacing: 6px; }
        .headline { fill: #ffffff; font-family: Didot, 'Bodoni 72', Georgia, serif; font-size: 88px; font-weight: 600; letter-spacing: -1.4px; }
        .subhead { fill: #f7f1df; font-family: Baskerville, 'Bodoni 72', Georgia, serif; font-size: 40px; font-style: italic; font-weight: 600; letter-spacing: 0.15px; }
      </style>
    </svg>
  `)
}

function titleCardSvg({ eyebrow, headline, subhead }) {
  const headlineLines = headline.split('\n')
  const headlineMarkup = headlineLines
    .map((line, index) => `<text x="642" y="${900 + index * 145}" text-anchor="middle" class="headline">${escapeXml(line)}</text>`)
    .join('')
  return Buffer.from(`
    <svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#061d31" stop-opacity="0.80"/><stop offset="0.55" stop-color="#103c4b" stop-opacity="0.45"/><stop offset="1" stop-color="#061a13" stop-opacity="0.78"/></linearGradient></defs>
      <rect width="1284" height="2778" fill="url(#wash)"/>
      <text x="642" y="770" text-anchor="middle" class="eyebrow">${escapeXml(eyebrow)}</text>
      ${headlineMarkup}
      <text x="642" y="${900 + headlineLines.length * 145 + 78}" text-anchor="middle" class="subhead">${escapeXml(subhead)}</text>
      <text x="642" y="1990" text-anchor="middle" class="brand">ULTIMATE GOLF COMMUNITY</text>
      <style>.eyebrow{fill:#f2d991;font:800 25px Arial,sans-serif;letter-spacing:5px}.headline{fill:#fff;font-family:Didot,'Bodoni 72',Georgia,serif;font-size:102px;font-weight:600;letter-spacing:-1.7px}.subhead{fill:#e4f2ed;font:500 32px Arial,sans-serif}.brand{fill:#fff;font:800 19px Arial,sans-serif;letter-spacing:3px;opacity:.82}</style>
    </svg>
  `)
}

function phoneFrameSvg() {
  return Buffer.from(`
    <svg width="896" height="1874" viewBox="0 0 896 1874" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="titanium" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f0eee9"/><stop offset="0.16" stop-color="#8e958f"/><stop offset="0.48" stop-color="#242b29"/><stop offset="0.82" stop-color="#a9ada8"/><stop offset="1" stop-color="#484d49"/>
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7f4eb"/><stop offset="0.46" stop-color="#444b47"/><stop offset="1" stop-color="#101513"/></linearGradient>
        <filter id="shadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="32" stdDeviation="30" flood-color="#00110d" flood-opacity="0.72"/></filter>
      </defs>
      <rect x="10" y="10" width="876" height="1854" rx="118" fill="url(#titanium)" filter="url(#shadow)"/>
      <rect x="18" y="18" width="860" height="1838" rx="111" fill="url(#edge)"/>
      <rect x="31" y="35" width="834" height="1804" rx="96" fill="#020403"/>
      <rect x="39" y="43" width="818" height="1788" rx="87" fill="none" stroke="#c8c9c4" stroke-opacity="0.35" stroke-width="2"/>
      <rect x="0" y="366" width="11" height="102" rx="5" fill="#545a56"/><rect x="0" y="503" width="11" height="154" rx="5" fill="#545a56"/><rect x="0" y="684" width="11" height="154" rx="5" fill="#545a56"/>
      <rect x="885" y="505" width="11" height="220" rx="5" fill="#545a56"/>
    </svg>
  `)
}

async function roundedScreen(input) {
  const resized = await sharp(input).resize({ width: 818, height: 1788, fit: 'fill' }).png().toBuffer()
  const mask = Buffer.from('<svg width="818" height="1788" xmlns="http://www.w3.org/2000/svg"><rect width="818" height="1788" rx="86" fill="white"/></svg>')
  return sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
}

function tournamentScoreboardSvg() {
  return Buffer.from(`
    <svg width="818" height="1788" viewBox="0 0 818 1788" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="657" width="818" height="1131" fill="#2f6c68"/>
      <rect x="36" y="688" width="746" height="82" rx="38" fill="#27645f" stroke="#77b9a7" stroke-opacity="0.64" stroke-width="2"/>
      <text x="130" y="740" text-anchor="middle" class="tab">POSTS</text><text x="307" y="740" text-anchor="middle" class="tab">ABOUT</text>
      <rect x="392" y="698" width="166" height="62" rx="31" fill="#78b85c"/>
      <text x="475" y="740" text-anchor="middle" class="tab active">SCORES</text><text x="655" y="740" text-anchor="middle" class="tab">PEOPLE</text>
      <text x="409" y="830" text-anchor="middle" class="eyebrow">CROSSVILLE CUP 2026</text>
      <text x="409" y="880" text-anchor="middle" class="title">TEAM SCOREBOARD</text>
      <rect x="42" y="914" width="350" height="252" rx="24" fill="#17493d" stroke="#d7b768" stroke-opacity="0.62" stroke-width="2"/>
      <rect x="426" y="914" width="350" height="252" rx="24" fill="#17493d" stroke="#d7b768" stroke-opacity="0.62" stroke-width="2"/>
      <text x="217" y="974" text-anchor="middle" class="team">TENNESSEE</text><text x="601" y="974" text-anchor="middle" class="team">GEORGIA</text>
      <text x="217" y="1086" text-anchor="middle" class="points">2</text><text x="601" y="1086" text-anchor="middle" class="points">1</text>
      <text x="217" y="1128" text-anchor="middle" class="label">POINTS</text><text x="601" y="1128" text-anchor="middle" class="label">POINTS</text>
      <text x="48" y="1234" class="day">DAY 1</text><text x="720" y="1234" text-anchor="end" class="date">JUN 13</text>
      <rect x="42" y="1262" width="734" height="202" rx="22" fill="#27645f" stroke="#9bd5c7" stroke-opacity="0.36" stroke-width="2"/>
      <text x="92" y="1320" class="player">Luke Restall</text><text x="726" y="1320" text-anchor="end" class="player">John Restall</text>
      <text x="92" y="1362" class="score">85 <tspan class="net">(71)</tspan></text><text x="726" y="1362" text-anchor="end" class="score">88 <tspan class="net">(74)</tspan></text>
      <text x="409" y="1348" text-anchor="middle" class="vs">VS.</text><text x="409" y="1424" text-anchor="middle" class="winner">LUKE WINS · MATCH PLAY</text>
      <rect x="42" y="1490" width="734" height="202" rx="22" fill="#27645f" stroke="#9bd5c7" stroke-opacity="0.36" stroke-width="2"/>
      <text x="92" y="1548" class="player">Team Tennessee</text><text x="726" y="1548" text-anchor="end" class="player">Team Georgia</text>
      <text x="92" y="1590" class="score">1</text><text x="726" y="1590" text-anchor="end" class="score">0</text>
      <text x="409" y="1576" text-anchor="middle" class="vs">VS.</text><text x="409" y="1652" text-anchor="middle" class="winner">TENNESSEE WINS · SCRAMBLE</text>
      <style>
        .tab{fill:#d9ece8;font:700 17px Arial,sans-serif;letter-spacing:.4px}.active{fill:#10382d}.eyebrow{fill:#f2d991;font:800 15px Arial,sans-serif;letter-spacing:2px}.title{fill:#fff;font-family:Didot,'Bodoni 72',Georgia,serif;font-size:34px;font-weight:600}.team{fill:#f2d991;font:800 17px Arial,sans-serif;letter-spacing:1.4px}.points{fill:#fff;font:800 82px Arial,sans-serif}.label{fill:#b9d0c9;font:800 13px Arial,sans-serif;letter-spacing:1.5px}.day{fill:#fff;font:800 23px Arial,sans-serif}.date{fill:#b9d0c9;font:700 16px Arial,sans-serif}.player{fill:#fff;font:700 19px Arial,sans-serif}.score{fill:#fff;font:800 34px Arial,sans-serif}.net{fill:#7ee5f4;font-size:20px}.vs{fill:#b9d0c9;font:800 14px Arial,sans-serif}.winner{fill:#7ee5f4;font:800 15px Arial,sans-serif;letter-spacing:.8px}
      </style>
    </svg>
  `)
}

async function createTournamentScoreboardScreen(input) {
  const base = await roundedScreen(input)
  return sharp(base).composite([{ input: tournamentScoreboardSvg(), top: 0, left: 0 }]).png().toBuffer()
}

await mkdir(outputRoot, { recursive: true })
await copyFile(backdrop, path.join(outputRoot, 'country-club-backdrop.png'))

for (const screen of screens) {
  const screenImage = await roundedScreen(path.join(sourceRoot, screen.input))
  const finalImage = await sharp(backdrop)
    .resize(canvas.width, canvas.height, { fit: 'cover', position: 'centre' })
    .composite([
      { input: textSvg(screen), top: 0, left: 0 },
      { input: phoneFrameSvg(), top: 690, left: 194 },
      { input: screenImage, top: 733, left: 233 }
    ])
    .png()
    .toFile(path.join(outputRoot, screen.output))
  console.log(finalImage)
}

await sharp(path.join(sourceRoot, '03-crossville-scores.png')).png().toFile(path.join(outputRoot, 'crossville-cup-scores-raw.png'))

const titleCards = [
  { output: 'preview-title-01.png', eyebrow: 'ULTIMATE GOLF COMMUNITY', headline: 'YOUR GOLF.\nYOUR CLUB.', subhead: 'Private-club connection, wherever you play.' },
  { output: 'preview-title-02.png', eyebrow: 'BUILD YOUR IDENTITY', headline: 'A PROFILE\nWITH PURPOSE.', subhead: 'Your golf life, all in one place.' },
  { output: 'preview-title-03.png', eyebrow: 'PLAY TOGETHER', headline: 'CREATE. COMPETE.\nCONNECT.', subhead: 'Tournaments made social.' },
  { output: 'preview-title-04.png', eyebrow: 'YOUR COMMUNITY', headline: 'MORE THAN\nA ROUND.', subhead: 'Golf is better together.' }
]
for (const card of titleCards) {
  await sharp(backdrop).resize(canvas.width, canvas.height, { fit: 'cover', position: 'centre' }).composite([{ input: titleCardSvg(card), top: 0, left: 0 }]).png().toFile(path.join(outputRoot, card.output))
}
