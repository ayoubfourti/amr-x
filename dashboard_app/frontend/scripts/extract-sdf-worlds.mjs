/**
 * Build the dashboard's deterministic digital-twin manifest from Gazebo/SDF
 * world files.
 *
 * Why this exists
 * ---------------
 * Browsers cannot render SDF directly. The dashboard only needs a safe,
 * lightweight subset of the simulation description: world metadata, entity
 * poses, primitive footprints, category hints, and calculated bounds. This
 * script extracts that subset into `src/generated/sdf-worlds.json`. Both the
 * 2D SVG floor-plan renderer and the lightweight 3D/isometric renderer consume
 * the same manifest, so changing a world updates both views.
 *
 * Supported input
 * ---------------
 * - SDF XML stored as `.sdf`
 * - Gazebo world files stored as `.world` (also SDF XML)
 * - top-level <model>, <include>, <actor>, and <light> elements
 * - box, cylinder, and plane primitives
 *
 * Meshes and remote Fuel models are not converted here. When exact primitive
 * geometry is unavailable, the extractor uses a category-aware footprint and
 * marks it as approximate. See the MkDocs page
 * `docs/interfaces/digital-twin-maps.md` for the schema and limitations.
 *
 * Commands
 * --------
 *   npm run worlds:extract        Write the manifest
 *   npm run worlds:check          Fail when the committed manifest is stale
 *   npm run worlds:extract -- --verbose
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '../../..')
const worldSourceDirs = [
  join(repoRoot, 'robotics/simulation/worlds'),
  join(repoRoot, 'robotics/navigation/maps'),
]
const modelSourceDirs = [
  join(repoRoot, 'robotics/simulation/models'),
  join(repoRoot, 'robotics/simulation/fuel_models'),
]
const worldExtensions = new Set(['.sdf', '.world'])
const outputFile = join(repoRoot, 'dashboard_app/frontend/src/generated/sdf-worlds.json')
const checkOnly = process.argv.includes('--check')
const verbose = process.argv.includes('--verbose')

/** Convert a whitespace-separated SDF vector into finite numbers. */
function numbers(value = '') {
  return value.trim().split(/\s+/).map(Number).filter(Number.isFinite)
}

/** Return the text content of the first matching XML tag. */
function firstTag(xml, tag) {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]?.trim() || ''
}

/**
 * Extract balanced XML blocks without adding a runtime XML dependency.
 *
 * A simple `<tag>.*</tag>` regex stops at the first nested closing tag. SDF
 * permits nested models, so this scanner counts matching opening/closing tags
 * and returns complete blocks. It is intentionally small and only used for the
 * SDF elements consumed by this generator; it is not a general XML parser.
 */
function extractBlocks(xml, tag) {
  const token = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
  const blocks = []
  let depth = 0
  let opening = null
  let match

  while ((match = token.exec(xml))) {
    const raw = match[0]
    const closing = raw.startsWith('</')
    const selfClosing = raw.endsWith('/>')

    if (!closing) {
      if (depth === 0) {
        opening = {
          attributes: raw
            .replace(new RegExp(`^<${tag}\\b`, 'i'), '')
            .replace(/\/?>$/, '')
            .trim(),
          bodyStart: token.lastIndex,
          blockStart: match.index,
        }
      }
      if (!selfClosing) depth += 1
      else if (depth === 0) {
        blocks.push({ attributes: opening.attributes, body: '', source: raw })
        opening = null
      }
      continue
    }

    if (depth === 0) continue
    depth -= 1
    if (depth === 0 && opening) {
      blocks.push({
        attributes: opening.attributes,
        body: xml.slice(opening.bodyStart, match.index),
        source: xml.slice(opening.blockStart, token.lastIndex),
      })
      opening = null
    }
  }

  return blocks
}

/** Read an XML attribute from the attribute text returned by extractBlocks. */
function attribute(attributes, name) {
  return attributes.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] || ''
}

/** Assign a display category using stable, documented naming heuristics. */
function categoryFor(name, uri = '') {
  const value = `${name} ${uri}`.toLowerCase()
  if (/wall/.test(value)) return 'wall'
  if (/floor|ground/.test(value)) return 'floor'
  if (/rack|shelf|cabinet|storage|bookcase/.test(value)) return 'rack'
  if (/zone|area|region/.test(value)) return 'zone'
  if (/dock|charger|charging/.test(value)) return 'dock'
  if (/pallet|box|cart|trolley|crate/.test(value)) return 'payload'
  if (/curtain|door|portal|partition|gate/.test(value)) return 'partition'
  if (/chair|patient|person|visitor|nurse|actor|human/.test(value)) return 'actor'
  if (/elevator|station|sink|bed|sign/.test(value)) return 'landmark'
  if (/light|lamp/.test(value)) return 'light'
  return uri ? 'included' : 'obstacle'
}

function fallbackFor(category) {
  const footprints = {
    wall: [5, .2, 2.5],
    floor: [28, 50, .05],
    partition: [2.5, .25, 2.2],
    actor: [.7, .7, 1.7],
    landmark: [2, 2, 2.2],
    rack: [2.4, .8, 2],
    payload: [1.2, .9, 1],
    dock: [1.5, 1.5, .2],
    zone: [3, 3, .02],
    included: [1.2, 1.2, 1.2],
    obstacle: [1.2, 1.2, 1.2],
  }
  return footprints[category] || footprints.obstacle
}

/**
 * Extract a renderable primitive. `approximate` tells consumers that the SDF
 * used a mesh/include that was represented by a fallback footprint.
 */
function primitiveFrom(xml, fallback = [1.2, 1.2, 1.2]) {
  const geometryScope = firstTag(xml, 'geometry') || xml
  const boxBlock = extractBlocks(geometryScope, 'box')[0]
  const box = numbers(firstTag(boxBlock?.body || '', 'size'))
  if (box.length >= 3) return { type: 'box', size: box.slice(0, 3), approximate: false }

  const cylinderBlock = extractBlocks(geometryScope, 'cylinder')[0]
  const radius = Number(firstTag(cylinderBlock?.body || '', 'radius'))
  const length = Number(firstTag(cylinderBlock?.body || '', 'length'))
  if (cylinderBlock && Number.isFinite(radius) && radius > 0) {
    return {
      type: 'cylinder',
      radius,
      length: Number.isFinite(length) && length > 0 ? length : 1,
      approximate: false,
    }
  }

  const planes = extractBlocks(geometryScope, 'plane')
    .map((plane) => numbers(firstTag(plane.body, 'size')))
    .filter((size) => size.length >= 2 && size[0] > 0 && size[1] > 0)
    .sort((a, b) => a[0] * a[1] - b[0] * b[1])
  if (planes[0]) {
    return { type: 'plane', size: [planes[0][0], planes[0][1], .02], approximate: false }
  }

  return { type: 'box', size: fallback, approximate: true }
}

/**
 * Parse x, y, z, roll, pitch, yaw. Model poses must be read before nested link
 * poses; include/actor/light blocks may read the first pose in their full body.
 */
function parsePose(xml, beforeNested = true) {
  const scope = beforeNested ? xml.split(/<(?:link|visual|collision)\b/i)[0] : xml
  const pose = numbers(firstTag(scope, 'pose'))
  return [...pose, 0, 0, 0, 0, 0, 0].slice(0, 6)
}

/** Recursively discover files while preserving deterministic sorted output. */
async function discoverFiles(directory, accept) {
  const files = []
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return files
    throw error
  }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await discoverFiles(path, accept))
    else if (accept(path)) files.push(path)
  }
  return files
}

/**
 * Index local model primitives by directory name. Includes such as
 * `model://StorageRack` can then use the local model's collision geometry
 * instead of a generic cube whenever that geometry is available.
 */
async function buildModelGeometryIndex() {
  const index = new Map()
  for (const directory of modelSourceDirs) {
    const modelFiles = await discoverFiles(directory, (path) => basename(path).toLowerCase() === 'model.sdf')
    for (const path of modelFiles) {
      const xml = await readFile(path, 'utf8')
      const model = extractBlocks(xml, 'model')[0]
      if (!model) continue
      const name = attribute(model.attributes, 'name') || basename(dirname(path))
      const geometry = primitiveFrom(model.body)
      for (const key of new Set([name, basename(dirname(path))])) {
        index.set(key.toLowerCase(), geometry)
      }
    }
  }
  return index
}

function includedModelKey(uri) {
  return decodeURIComponent(uri.replace(/^model:\/\//i, '').split('/')[0]).toLowerCase()
}

function humanize(value) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.toLowerCase() === 'amr' ? 'AMR' : part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function entityHalfExtents(entity) {
  if (entity.geometry.type === 'cylinder') {
    return { x: entity.geometry.radius, y: entity.geometry.radius }
  }
  const [width = 1, height = 1] = entity.geometry.size || []
  const yaw = entity.pose[5] || 0
  const cos = Math.abs(Math.cos(yaw))
  const sin = Math.abs(Math.sin(yaw))
  return {
    x: (cos * width + sin * height) / 2,
    y: (sin * width + cos * height) / 2,
  }
}

/** Calculate non-origin-centered metric bounds, accounting for entity yaw. */
function calculateBounds(entities) {
  const floor = entities.find((entity) => entity.category === 'floor')
  const floorSize = floor?.geometry?.size || []
  let minX
  let maxX
  let minY
  let maxY

  if (
    !floor?.geometry?.approximate
    && floorSize[0] > 0 && floorSize[0] < 80
    && floorSize[1] > 0 && floorSize[1] < 80
  ) {
    minX = floor.pose[0] - floorSize[0] / 2
    maxX = floor.pose[0] + floorSize[0] / 2
    minY = floor.pose[1] - floorSize[1] / 2
    maxY = floor.pose[1] + floorSize[1] / 2
  } else {
    const positioned = entities.filter((entity) => entity.category !== 'floor' && entity.category !== 'light')
    const extents = positioned.map((entity) => {
      const half = entityHalfExtents(entity)
      return {
        minX: entity.pose[0] - half.x,
        maxX: entity.pose[0] + half.x,
        minY: entity.pose[1] - half.y,
        maxY: entity.pose[1] + half.y,
      }
    })
    const padding = positioned.some((entity) => entity.category === 'wall') ? 0 : 1.5
    minX = extents.length ? Math.min(...extents.map((item) => item.minX)) - padding : -6
    maxX = extents.length ? Math.max(...extents.map((item) => item.maxX)) + padding : 6
    minY = extents.length ? Math.min(...extents.map((item) => item.minY)) - padding : -4
    maxY = extents.length ? Math.max(...extents.map((item) => item.maxY)) + padding : 4
  }

  // Keep tiny test worlds legible without changing their metric center.
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const width = Math.max(12, maxX - minX)
  const height = Math.max(8, maxY - minY)
  minX = centerX - width / 2
  maxX = centerX + width / 2
  minY = centerY - height / 2
  maxY = centerY + height / 2

  return Object.fromEntries(
    Object.entries({ minX, maxX, minY, maxY, width, height })
      .map(([key, value]) => [key, Number(value.toFixed(2))]),
  )
}

function validateWorld(world) {
  const problems = []
  if (!world.id || !world.name) problems.push('missing id or name')
  if (!world.entities.length) problems.push('contains no renderable entities')
  if (!(world.bounds.width > 0 && world.bounds.height > 0)) problems.push('has invalid bounds')
  if (world.entities.some((entity) => entity.pose.length !== 6 || entity.pose.some((value) => !Number.isFinite(value)))) {
    problems.push('contains an invalid pose')
  }
  const ids = world.entities.map((entity) => entity.id)
  if (new Set(ids).size !== ids.length) problems.push('contains duplicate entity ids')
  return problems
}

function parseWorld(xml, source, modelGeometryIndex) {
  const worldBlock = extractBlocks(xml, 'world')[0]
  if (!worldBlock) return null

  const worldName = attribute(worldBlock.attributes, 'name') || basename(source, extname(source))
  const worldXml = worldBlock.body
  const entities = []
  const entityIds = new Map()

  const addEntity = (entity) => {
    const count = (entityIds.get(entity.id) || 0) + 1
    entityIds.set(entity.id, count)
    entities.push({ ...entity, id: count === 1 ? entity.id : `${entity.id}-${count}` })
  }

  for (const block of extractBlocks(worldXml, 'model')) {
    const name = attribute(block.attributes, 'name') || `model_${entities.length + 1}`
    addEntity({
      id: name,
      name,
      category: categoryFor(name),
      pose: parsePose(block.body),
      geometry: primitiveFrom(block.body),
      sourceType: 'model',
    })
  }

  for (const block of extractBlocks(worldXml, 'include')) {
    const uri = firstTag(block.body, 'uri')
    const name = firstTag(block.body, 'name') || uri.replace(/^model:\/\//i, '') || `include_${entities.length + 1}`
    const category = categoryFor(name, uri)
    const indexedGeometry = modelGeometryIndex.get(includedModelKey(uri))
    const localGeometry = indexedGeometry && !indexedGeometry.approximate ? indexedGeometry : null
    addEntity({
      id: name,
      name,
      uri,
      category,
      pose: parsePose(block.body, false),
      geometry: localGeometry || primitiveFrom('', fallbackFor(category)),
      sourceType: 'include',
      geometrySource: localGeometry ? 'local-model' : 'category-fallback',
    })
  }

  for (const block of extractBlocks(worldXml, 'actor')) {
    const name = attribute(block.attributes, 'name') || `actor_${entities.length + 1}`
    addEntity({
      id: name,
      name,
      category: 'actor',
      pose: parsePose(block.body, false),
      geometry: primitiveFrom(block.body, fallbackFor('actor')),
      sourceType: 'actor',
    })
  }

  for (const block of extractBlocks(worldXml, 'light')) {
    const name = attribute(block.attributes, 'name') || `light_${entities.length + 1}`
    const type = attribute(block.attributes, 'type') || 'point'
    addEntity({
      id: name,
      name,
      category: 'light',
      pose: parsePose(block.body, false),
      geometry: {
        type: 'light',
        range: Number(firstTag(block.body, 'range')) || 8,
        lightType: type,
        approximate: false,
      },
      sourceType: 'light',
    })
  }

  const world = {
    id: basename(source, extname(source)).replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
    name: worldName,
    label: humanize(worldName),
    source: relative(repoRoot, source),
    format: extname(source).slice(1).toLowerCase(),
    bounds: calculateBounds(entities),
    counts: entities.reduce((acc, entity) => {
      acc[entity.category] = (acc[entity.category] || 0) + 1
      return acc
    }, {}),
    entities,
  }
  const problems = validateWorld(world)
  if (problems.length) throw new Error(`${world.source}: ${problems.join('; ')}`)
  return world
}

function ensureUniqueWorldIds(worlds) {
  const seen = new Map()
  return worlds.map((world) => {
    const count = (seen.get(world.id) || 0) + 1
    seen.set(world.id, count)
    if (count === 1) return world
    const parent = basename(dirname(world.source)).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    return { ...world, id: `${world.id}-${parent}-${count}` }
  })
}

const modelGeometryIndex = await buildModelGeometryIndex()
const sources = []
for (const directory of worldSourceDirs) {
  sources.push(...await discoverFiles(directory, (path) => worldExtensions.has(extname(path).toLowerCase())))
}

const worlds = []
for (const source of sources.sort()) {
  const xml = await readFile(source, 'utf8')
  const world = parseWorld(xml, source, modelGeometryIndex)
  if (world) worlds.push(world)
  else if (verbose) console.warn(`Skipped ${relative(repoRoot, source)}: no <world> element`)
}

const uniqueWorlds = ensureUniqueWorldIds(worlds)
if (!uniqueWorlds.length) {
  throw new Error(`No SDF worlds found in: ${worldSourceDirs.map((path) => relative(repoRoot, path)).join(', ')}`)
}

const manifest = {
  schemaVersion: 2,
  generator: 'dashboard_app/frontend/scripts/extract-sdf-worlds.mjs',
  sourceRoots: worldSourceDirs.map((path) => relative(repoRoot, path)),
  supportedExtensions: [...worldExtensions],
  worlds: uniqueWorlds,
}
const serialized = `${JSON.stringify(manifest, null, 2)}\n`

if (checkOnly) {
  let current = ''
  try {
    current = await readFile(outputFile, 'utf8')
  } catch {
    // The comparison below reports the missing/stale manifest consistently.
  }
  if (current !== serialized) {
    console.error(`Generated world manifest is stale. Run: npm run worlds:extract`)
    process.exitCode = 1
  } else {
    console.log(`World manifest is current (${uniqueWorlds.length} worlds).`)
  }
} else {
  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, serialized)
  const entityCount = uniqueWorlds.reduce((sum, world) => sum + world.entities.length, 0)
  const approximateCount = uniqueWorlds.reduce(
    (sum, world) => sum + world.entities.filter((entity) => entity.geometry.approximate).length,
    0,
  )
  console.log(
    `Extracted ${uniqueWorlds.length} worlds and ${entityCount} entities `
    + `(${approximateCount} approximate) to ${relative(repoRoot, outputFile)}`,
  )
}

if (verbose) {
  for (const world of uniqueWorlds) {
    console.log(
      `- ${world.id}: ${world.entities.length} entities, `
      + `${world.bounds.width} × ${world.bounds.height} m, ${world.source}`,
    )
  }
}
