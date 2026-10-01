"""ARマーカーの上に出す立体物（データパイプラインの依存グラフ）を glTF で生成する。

既存の3Dモデルを拾ってくるのではなくスクリプトで組み立てているのは、
依存グラフの形そのものが題材だから。ノードとエッジの定義を差し替えれば
別のパイプラインの形がそのまま出力される。

  uv run --with trimesh --with numpy python tools/build_model.py

出力: models/pipeline_dag.glb
"""

import pathlib

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT = pathlib.Path(__file__).resolve().parent.parent / "models" / "pipeline_dag.glb"

# 色（タスク8のVR版と揃えてある）
OK = (0.30, 0.62, 0.86)      # 正常
LATE = (1.00, 0.35, 0.35)    # 遅延している
RISK = (0.91, 0.64, 0.24)    # 遅延の下流で、SLAを割りそう
EDGE = (0.53, 0.57, 0.63)    # 依存の線

NODE = 0.13          # ノードの一辺
LIFT = 0.10          # マーカー面からの浮かせ量
EDGE_R = 0.008       # 線の太さ

# マーカーは水平に置くので、グラフも水平（XZ平面）に寝かせる。
# x が上流→下流、z が同じ層の中の並び。
NODES = {
    "ad_impressions": ((-0.72, LIFT, -0.42), OK),
    "ad_clicks":      ((-0.72, LIFT,  0.00), LATE),
    "cost":           ((-0.72, LIFT,  0.42), OK),
    "stg_events":     (( 0.00, LIFT, -0.20), RISK),
    "stg_cost":       (( 0.00, LIFT,  0.30), OK),
    "mart_daily":     (( 0.74, LIFT,  0.02), RISK),
}

EDGES = [
    ("ad_impressions", "stg_events", EDGE),
    ("ad_clicks",      "stg_events", LATE),   # 遅延が伝わっている経路
    ("cost",           "stg_cost",   EDGE),
    ("stg_events",     "mart_daily", RISK),
    ("stg_cost",       "mart_daily", EDGE),
]


def paint(mesh, rgb):
    """glb に色を持たせる。頂点色ではなく PBR マテリアルで入れる
    （A-Frame / three.js 側で素直に出るのはこちら）。"""
    mesh.visual = trimesh.visual.TextureVisuals(
        material=PBRMaterial(
            baseColorFactor=[*rgb, 1.0],
            metallicFactor=0.0,
            roughnessFactor=0.55,
        )
    )
    return mesh


def main():
    scene = trimesh.Scene()

    for name, (pos, rgb) in NODES.items():
        box = trimesh.creation.box(extents=(NODE, NODE, NODE))
        box.apply_translation(pos)
        scene.add_geometry(paint(box, rgb), node_name=f"node_{name}")

    for a, b, rgb in EDGES:
        pa = np.array(NODES[a][0], dtype=float)
        pb = np.array(NODES[b][0], dtype=float)
        cyl = trimesh.creation.cylinder(radius=EDGE_R, segment=[pa, pb], sections=10)
        scene.add_geometry(paint(cyl, rgb), node_name=f"edge_{a}__{b}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(trimesh.exchange.gltf.export_glb(scene))

    size = OUT.stat().st_size
    print(f"[build_model] {OUT.name}  nodes={len(NODES)} edges={len(EDGES)} size={size}B")


if __name__ == "__main__":
    main()
