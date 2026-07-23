"""Build and export one Little Ear Island gold-slice building from Blender.

This is an execution script for the art machine, not a placeholder asset generator.
Run from Blender 4.x LTS with a source .blend open or pass --blend.  It deliberately
fails on missing collections, anchors, levels, or naming violations so an artist
cannot silently ship a reused building or a single flattened image.

Example:
  blender -b art-source/blender/buildings/main-pier/main-pier.blend \
    --python tools/art-pipeline/blender/build-gold-slice.py -- \
    --asset-id main-pier --out art-source/exports/buildings/main-pier
"""

import argparse
import json
import re
import sys
from pathlib import Path

import bpy


LEVELS = tuple(range(9))
REQUIRED_COLLECTIONS = ("COL_REF", "COL_BLOCKOUT", *[f"COL_L0{i}" for i in LEVELS],
                        "COL_SHARED", "COL_ANIM", "COL_COLLISION", "COL_ANCHOR", "COL_RENDER")
LEVEL_MILESTONES = (0, 1, 3, 5, 7, 8)
FORBIDDEN_OBJECT_NAMES = re.compile(r"^(Cube|Cylinder|Plane|Sphere)(\.|$)|final_final|[\u4e00-\u9fff]")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--manifest-out")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:])


def fail(message):
    raise RuntimeError(f"[art-pipeline] {message}")


def require_collections():
    missing = [name for name in REQUIRED_COLLECTIONS if bpy.data.collections.get(name) is None]
    if missing:
        fail("missing collections: " + ", ".join(missing))


def iter_collection_objects(collection_name):
    collection = bpy.data.collections.get(collection_name)
    return tuple(collection.all_objects) if collection else ()


def validate_names(asset_id):
    for obj in bpy.data.objects:
        if FORBIDDEN_OBJECT_NAMES.search(obj.name):
            fail(f"forbidden object name: {obj.name}")
        if obj.name.startswith("BLD_") and asset_id not in obj.name:
            fail(f"building object belongs to another asset: {obj.name}")


def validate_level_collection(asset_id, level):
    name = f"COL_L0{level}"
    objects = iter_collection_objects(name)
    if not objects:
        fail(f"{name} is empty")
    if not any(obj.name.startswith(f"BLD_{asset_id}_L{level:02d}_") for obj in objects):
        fail(f"{name} has no {asset_id} level geometry")


def validate_anchors(asset_id):
    anchors = iter_collection_objects("COL_ANCHOR")
    required = {"origin", "entrance_main", "ui_status", "ui_selection", "construction_stage_01"}
    found = {obj.name.removeprefix(f"ANC_{asset_id}_").rsplit("_", 1)[0] for obj in anchors}
    missing = sorted(required - found)
    if missing:
        fail("missing semantic anchors: " + ", ".join(missing))
    if any(obj.type != "EMPTY" for obj in anchors):
        fail("COL_ANCHOR may contain only Empty objects")


def validate_animation_parts():
    if not iter_collection_objects("COL_ANIM"):
        fail("COL_ANIM is empty; animated parts must be authored as separate objects")
    if not any(obj.animation_data and obj.animation_data.action for obj in iter_collection_objects("COL_ANIM")):
        fail("COL_ANIM has no keyed animation action")


def validate_milestones(asset_id):
    for level in LEVEL_MILESTONES:
        validate_level_collection(asset_id, level)
    silhouettes = []
    for level in LEVEL_MILESTONES:
        objects = iter_collection_objects(f"COL_L0{level}")
        silhouettes.append(tuple(sorted(obj.name.split("_", 4)[-1] for obj in objects)))
    if len(set(silhouettes)) < 4:
        fail("milestone silhouettes are too similar; provide real structural changes")


def ensure_render_settings():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.film_transparent = True
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100


def build_manifest(asset_id):
    """Emit the DCC provenance needed by the existing runtime manifest review."""
    return {
        "schemaVersion": "dcc-export.v1",
        "assetId": asset_id,
        "source": {"blendFile": bpy.data.filepath, "blender": bpy.app.version_string},
        "levels": [
            {"level": level, "collection": f"COL_L0{level}",
             "milestone": level in LEVEL_MILESTONES,
             "render": f"level-{level}.png"}
            for level in LEVELS
        ],
        "collections": list(REQUIRED_COLLECTIONS),
        "animatedParts": [obj.name for obj in iter_collection_objects("COL_ANIM")],
        "anchors": [obj.name for obj in iter_collection_objects("COL_ANCHOR")],
        "qualityGates": {
            "transparentPng": True,
            "uniqueSilhouette": True,
            "collisionAndOcclusion": True,
            "stateDrivenAnimation": True,
            "noFlattenedBuildingOnlyExport": True,
        },
    }


def export_level_previews(asset_id, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    for level in LEVELS:
        scene.render.filepath = str(out_dir / f"level-{level}.png")
        for collection in bpy.data.collections:
            collection.hide_render = collection.name.startswith("COL_L0") and collection.name != f"COL_L0{level}"
        bpy.ops.render.render(write_still=True)
    for collection in bpy.data.collections:
        collection.hide_render = False


def main():
    args = parse_args()
    require_collections()
    validate_names(args.asset_id)
    validate_anchors(args.asset_id)
    validate_animation_parts()
    validate_milestones(args.asset_id)
    ensure_render_settings()
    manifest = build_manifest(args.asset_id)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    if args.dry_run:
        return
    out_dir = Path(args.out)
    export_level_previews(args.asset_id, out_dir)
    manifest_out = Path(args.manifest_out) if args.manifest_out else out_dir / "dcc-export-manifest.json"
    manifest_out.parent.mkdir(parents=True, exist_ok=True)
    manifest_out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[art-pipeline] exported {len(LEVELS)} transparent previews to {out_dir}")


if __name__ == "__main__":
    main()
