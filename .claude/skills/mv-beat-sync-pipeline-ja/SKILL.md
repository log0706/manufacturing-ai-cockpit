---
name: mv-beat-sync-pipeline-ja
description: |
  AI生成クリップ（Veo等）と楽曲から、ビート同期MVをフレーム精度で組み上げる実装手順書。音源実測→モーラ解析→シーン構成→生成プロンプト→EDL→ワンパスビルド→検証・キャラ崩れ監査の7フェーズ。
  Use when: MV編集, ビート同期, カット割り, EDL設計, ffmpeg concat, フレーム精度, 生成クリップ, キャラ崩れ監査, 尺ズレ, 暗転設計
  Do not use when: Remotion/Reactでの合成が主体（→mv-production-master）／楽曲そのものの制作（→suno-music-production）
---

# MV Beat Sync Pipeline (JA)

## Classification
Standalone Implementation Skill.（映像素材が既にある前提の「編集・検証」パイプライン）

## Iron Law
**尺は秒で語らない。すべてフレーム番号で語る。**
セグメントを個別に切り出して連結する方式は必ずドリフトする。最終ビルドは
`start_frame` / `end_frame` を持つEDLから **ワンパス** で組む。

## Use When
- AI生成クリップ（Veo 3.1 / Sora / Runway等）が手元にあり、楽曲に合わせて編集する。
- カット割りをBPMグリッドに量子化したい。
- 「なんとなく合ってない」MVの原因を、実測値で特定したい。
- 生成クリップのキャラ崩れを体系的に監査し、処置を決めたい。

## Do Not Use When
- Remotion / React でプログラム合成する（→ `mv-production-master`）。
- 楽曲・歌詞そのものを作る（→ `suno-music-production` / `songwriting-engine`）。

---

## Pipeline Overview

```
[1] 音源解析     → BPM / ビートグリッド式 / RMS推移 / 静寂点 / 構造境界
[2] モーラ解析   → 歌詞の音数密度 → カット割りの根拠
[3] シーン構成   → 起承転結 + 歌詞モチーフの映像翻訳
[4] 生成プロンプト → 共通プリアンブル + 差分本文
[5] EDL設計      → グリッド量子化 + 暗転着地設計
[6] ワンパスビルド → start_frame / end_frame でフレーム精度連結
[7] 検証・監査   → blackdetect / 代表フレーム目視 / OK・borderline・broken 判定
```

各フェーズは**前フェーズの実測値を入力にする**。推定値で次に進まない。

---

## Phase 1 — 音源解析

`references/audio_analysis.py` を実行し、以下を確定させる。

| 出力 | 用途 |
|---|---|
| BPM（実測） | ビートグリッド式の分母 |
| ビートグリッド式 | `t(n) = offset + n * 60/BPM` |
| RMS推移（0.1s窓） | 盛り上がり位置 → 長回し/速切りの配分 |
| 静寂点（RMS谷） | 暗転・ブレイクの着地点 |
| 構造境界 | Intro / Verse / Pre / Chorus / Bridge / Outro の秒数 |

**確定事項として書き出す**（後続フェーズはこの表だけを参照する）:

```
BPM        : 128.0
offset     : 0.184 s
grid       : t(n) = 0.184 + n * 0.46875
1小節      : 1.875 s (4/4)
Chorus in  : 47.34 s (= grid n=100)
静寂点     : 46.9s, 92.1s, 138.4s
total      : 213.66 s @30fps = 6410 frames
```

**注意**: BPMが小数（例 127.97）の場合、後半で数百msズレる。曲全体を通したビート位置を実測し、必要なら前半/後半で別グリッドを持つ。

---

## Phase 2 — 歌詞のモーラ解析

歌詞を **モーラ単位**（拗音は1、促音・撥音・長音は各1）で数え、行あたりの密度を出す。

```
Verse1 L1: 「あ/め/の/ま/ど/に」        =  6モーラ / 1.875s → 3.2 mora/s → 低密度
Chorus L1: 「き/み/の/こ/え/が/ひ/び/く」= 9モーラ / 1.875s → 4.8 mora/s → 高密度
```

**カット割りへの翻訳ルール**:

| 密度 | カット長 | 意図 |
|---|---|---|
| 〜3.5 mora/s | 2〜4小節（3.75〜7.5s） | 情景を見せる。長回し。 |
| 3.5〜5.0 | 1〜2小節 | 標準。歌詞のフレーズ単位で切る。 |
| 5.0〜 | 1/2小節（0.94s）以下 | 畳み掛け。速切り。 |
| 無声部（間奏） | 最長 | 呼吸。ここで暗転を置く。 |

この表が **「なぜこのカット長なのか」の唯一の根拠**。感覚で決めない。

---

## Phase 3 — シーン構成設計

1. 曲全体を起承転結に割る（Phase1の構造境界を境目に使う）。
2. 各セクションに **1つだけ** 映像的主題を割り当てる（複数入れると散る）。
3. 歌詞のモチーフを**具体物**に翻訳する。抽象語のまま生成プロンプトに渡さない。

```
「孤独」   → ×そのまま渡す
           → ○ 深夜のコインランドリー、回る乾燥機、他に誰もいない
「加速」   → ○ 首都高の白線が伸びる、車窓の光条
```

4. **キャラ設計を1箇所に固定する**（Phase4の共通プリアンブルになる）。
   髪型・髪色・服・年齢・体型・アクセサリを文字列として確定し、以後**一字一句変えない**。

---

## Phase 4 — 生成プロンプトの構造化

**共通プリアンブル + 差分本文** の2層構造にする。

```
[共通プリアンブル] ← 全カットで完全一致させる（コピペ、書き換え禁止）
  被写体: 20代後半の日本人女性、肩までの黒髪ストレート、
          オーバーサイズの黒いレザージャケット、白Tシャツ、細い銀のピアス
  画調  : シネマティック、35mm、浅い被写界深度、ネオンの色被り、粒状感
  禁止  : テキスト、ロゴ、透かし、顔の変形、指の破綻

[差分本文] ← カットごとに変える
  カメラ: ゆっくりドリーイン
  動作  : 窓の外を見て、ゆっくり瞬きする
  環境  : 雨の夜、コインランドリーの蛍光灯
  尺    : 8秒
```

**運用ルール**:
- プリアンブルを1文字でも変えるとキャラが飛ぶ。差分を入れるなら差分本文側に書く。
- 尺は生成上限（Veo 3.1なら8s等）に合わせ、EDLで使うのは**その内側の安定区間**だけと想定して余裕を持って生成する。
- 同一カットは最低2バリエーション生成する（Phase7の差替原資になる）。

---

## Phase 5 — EDL設計

EDLは **フレーム単位** の表として作る。

```python
# fps=30, grid = 0.184 + n*0.46875 (BPM128)
EDL = [
  # src,                 src_in_f, dur_f, note
  ("clips/c01_laundry.mp4",   12,   113, "Intro 静, 2小節長回し"),
  ("clips/c02_window.mp4",     6,    56, "Verse1 L1"),
  ...
]
```

**設計ルール**:
1. すべてのカット境界を **ビートグリッドに量子化** する。
   `frame = round((0.184 + n*0.46875) * fps)` — 端数は必ず四捨五入して整数化。
2. 量子化の**単位を決める**: 通常1小節、盛り上がりで1/2小節、畳み掛けで1/4小節。
   1/8以下は視認できずチラつくだけ。使わない。
3. **暗転はPhase1の静寂点に着地させる**。音が消える frame に黒の開始を合わせる。
   暗転長は 1/2小節（0.94s）を基準。1小節超は間延びする。
4. 尺合わせは **最終カットの末尾** で吸収する。中間で微調整すると全カットがズレる。
5. EDLの `dur_f` の総和が、音源の総フレーム数と**完全一致**することを組む前に検算する。

```python
assert sum(d for _, _, d, _ in EDL) == TOTAL_FRAMES, "尺不一致"
```

---

## Phase 6 — ワンパス・フレーム精度ビルド

`references/onepass_build.py` を使う。パスとEDLを差し替えれば別曲でも動く。

### 最重要の教訓（今回の最大の落とし穴）

**やってはいけない**:
```bash
# ❌ セグメントを個別に切り出して concat
ffmpeg -ss 0.4 -t 3.76 -i c01.mp4 seg01.mp4   # -t は秒 → キーフレーム都合で±数frameズレる
ffmpeg -f concat -i list.txt out.mp4           # ズレが累積し、後半で1秒以上ドリフトする
```
症状: 「冒頭は合っているのに、サビでどんどん音とズレる」。

**正しい**:
```bash
# ✅ 全入力を1コマンドに渡し、trim をフレーム番号で指定してワンパス連結
ffmpeg -i c01.mp4 -i c02.mp4 ... -filter_complex \
  "[0:v]trim=start_frame=12:end_frame=125,setpts=PTS-STARTPTS[v0]; \
   [1:v]trim=start_frame=6:end_frame=62,setpts=PTS-STARTPTS[v1]; \
   [v0][v1]concat=n=2:v=1:a=0[vout]" \
  -map "[vout]" -map 1:a ...
```

### その他の落とし穴

| 症状 | 原因 | 対処 |
|---|---|---|
| 後半で音ズレが増える | 秒指定trim / concat demuxer | `start_frame`/`end_frame` でワンパス |
| カットが1フレーム飛ぶ | `end_frame` を inclusive と誤解 | `end_frame` は **exclusive**。`in + dur` を渡す |
| 素材のfpsが混在 | 生成物が24/30/60混在 | 全入力に `fps=30` を trim の**前**に挿す |
| 解像度が混在 | 生成サービス差 | `scale=W:H:force_original_aspect_ratio=decrease,pad` で統一 |
| 音が途中で切れる | 映像合計が音源より短い | 末尾に黒を足すか、最終カットを伸ばす |
| 出力が異常に重い | `-crf` 未指定 | `-c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p` |

ビルド後は必ず**実測フレーム数**を確認する（設計値と一致しなければやり直し）:
```bash
ffprobe -v error -select_streams v:0 -count_frames \
  -show_entries stream=nb_read_frames -of csv=p=0 out.mp4
```

---

## Phase 7 — 検証とキャラ崩れ監査

### 7-1 機械検証

```bash
# 暗転が設計位置にあるか
ffmpeg -i out.mp4 -vf blackdetect=d=0.3:pic_th=0.98 -an -f null - 2>&1 | grep blackdetect

# 総尺・fps・音声長
ffprobe -v error -show_entries format=duration -show_entries stream=r_frame_rate,nb_frames out.mp4
```
blackdetect の検出秒 と Phase1の静寂点が **±1フレーム以内** で一致すること。

### 7-2 代表フレーム目視

各カットの **in / 中央 / out** の3枚を書き出して並べる。

```bash
ffmpeg -i out.mp4 -vf "select='eq(n\,{F})'" -vsync 0 -frames:v 1 audit/f{F}.png
```

### 7-3 キャラ崩れ判定（3段階）

| 判定 | 基準 | 処置 |
|---|---|---|
| **OK** | 髪型・服・顔立ちが基準カットと一致 | そのまま |
| **borderline** | 一瞬だけ崩れる／画面小さく目立たない | **①トリム替え**（崩れる区間の外に `start_frame` をずらす） |
| **broken** | 別人・指破綻・服が変わる | **②差替**（Phase4で作った別バリエーション）→ 無ければ **③再生成** |

**処置は必ずこの順**。①→②→③ の順でコストが跳ね上がるので、まずトリムで逃げられないか見る。
再生成する場合は、共通プリアンブルは絶対に変えず、差分本文のカメラ／動作だけ変えて引き直す。

### 7-4 完了条件

- [ ] `nb_read_frames` が設計 `TOTAL_FRAMES` と一致
- [ ] blackdetect が設計暗転位置と一致
- [ ] 全カットの代表フレームを目視済み、`broken` がゼロ
- [ ] 音源末尾と映像末尾が同時に終わる
- [ ] 上記を実測値付きで報告（「たぶん合っている」は禁止）

---

## References

- `references/audio_analysis.py` — Phase1 の音源解析（BPM・RMS・静寂点・ビートグリッド）
- `references/onepass_build.py` — Phase6 のフレーム精度ワンパスビルド雛形

## Related Skills
- `mv-production-master` — Remotion による合成が主体の場合
- `suno-music-production` — 楽曲そのものの制作
- `video-media-production` — 生成プロンプト設計の詳細
