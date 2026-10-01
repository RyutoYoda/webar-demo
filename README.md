# webar-demo

AR.js + A-Frame のマーカー型 WebAR デモ。マーカーを映すと、データパイプラインの
依存グラフ（立体物）が机の上に出る。

公開先: https://ryutoyoda.github.io/webar-demo/

| ページ | 内容 |
|---|---|
| `index.html` | AR版。カメラでマーカーを読む |
| `preview.html` | カメラとマーカー無しで同じ中身を見るための確認用ページ |

## 中身

朝7時に遅延アラートが出た直後のデータ基盤を想定している。
`ad_impressions / ad_clicks / cost` → `stg_events / stg_cost` → `mart_daily` の
3層で、遅延している `ad_clicks` が赤、その影響を受ける下流が橙。
`mart_daily` のまわりだけ赤い枠が明滅する。

## ファイル

| パス | 内容 |
|---|---|
| `index.html` | ARシーン。マーカーは自作パターンと `hiro` の2つに対応 |
| `preview.html` | 非AR版。`look-controls` / `wasd-controls` で見回せる |
| `js/lineage-overlay.js` | マーカーの上に出す中身を組み立てる A-Frame コンポーネント |
| `models/pipeline_dag.glb` | 表示する立体物（スクリプト生成） |
| `tools/build_model.py` | 上の glb を生成するスクリプト |
| `marker/my-icon-marker.patt` | 自作マーカーのパターンファイル |
| `marker/my-icon-marker.png` | 同、印刷・表示用の画像 |

## 立体物を作り直す

既存の3Dモデルを拾ってくるのではなく、スクリプトで組み立てている。
依存グラフの形そのものが題材なので、ノードとエッジの定義を差し替えれば
別のパイプラインの形がそのまま出力される。

```bash
uv run --with trimesh --with numpy python tools/build_model.py
# -> models/pipeline_dag.glb
```

## 設計メモ

- **ラベルは glb に焼き込んでいない。** テーブル名は `js/lineage-overlay.js` 側で
  `a-text` として重ねている。名前が変わってもモデルを作り直さずに済む
- **マーカーを2種類用意した。** 自作パターンだけだと手元にマーカーが無い人は試せないので、
  AR.js 標準の `hiro` でも同じものが出るようにしてある
- **文字はマーカー面に寝かせている**（`rotation="-90 0 0"`）。マーカーは机に平置きするので、
  立てるより上から見下ろして読む方が自然になる
- **`preview.html` を別に置いた。** ARはカメラとマーカーが揃わないと何も確認できず、
  「動いていないのか、マーカーが認識されていないだけなのか」が切り分けられない。
  立体物だけ先に確認できるページがあると、問題の切り分けが早い

## 動かし方（ローカル）

カメラを使うため、`file://` では動かない。HTTPSかlocalhostで配信する。

```bash
python3 -m http.server 8912
# http://localhost:8912/
```
