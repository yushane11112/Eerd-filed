import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const scriptPath = path.join(root, 'tools/art-pipeline/blender/build-gold-slice.py')
const specPath = path.join(root, 'docs/project/gold-slice/model-animation-spec.md')
const script = fs.readFileSync(scriptPath, 'utf8')
const spec = fs.readFileSync(specPath, 'utf8')

const requiredScriptMarkers = [
  'LEVELS = tuple(range(9))',
  'REQUIRED_COLLECTIONS',
  'validate_names',
  'validate_anchors',
  'validate_animation_parts',
  'validate_milestones',
  'ensure_render_settings',
  'export_level_previews',
  'film_transparent = True',
  'noFlattenedBuildingOnlyExport',
]
const requiredSpecMarkers = [
  'Blender 4.x LTS',
  'COL_L00 ... COL_L08',
  'COL_ANIM',
  'TexturePacker 图集 + JSON',
  'Pixi Prefab',
]

const missingScript = requiredScriptMarkers.filter((marker) => !script.includes(marker))
const missingSpec = requiredSpecMarkers.filter((marker) => !spec.includes(marker))
if (missingScript.length || missingSpec.length) {
  console.error(JSON.stringify({ missingScript, missingSpec }, null, 2))
  process.exit(1)
}

console.log(`PASS art pipeline contract: ${requiredScriptMarkers.length} script gates, ${requiredSpecMarkers.length} spec gates`)
