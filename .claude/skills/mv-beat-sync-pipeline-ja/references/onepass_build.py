#!/usr/bin/env python3
"""Phase 6: フレーム精度ワンパスビルド.

セグメントを個別に切り出して concat する方式は必ずドリフトする。
全入力を1コマンドに渡し、trim=start_frame/end_frame でワンパス連結する。

パス（AUDIO / OUT / EDL）を差し替えれば別曲でも動く。

Usage:
    python onepass_build.py            # ビルド
    python onepass_build.py --check    # EDL検算のみ（ffmpegを叩かない）
    python onepass_build.py --verify   # 出力の実測検証（Phase 7-1）
"""

import argparse
import subprocess
import sys

# ==== ここだけ差し替える =====================================================
FPS = 30
W, H = 1920, 1080
AUDIO = "audio/song.wav"
OUT = "out/mv.mp4"
TOTAL_FRAMES = 6410  # Phase 1 の total_frames

# (src, src_in_frame, duration_frame, note)
# duration は Phase 5 でビートグリッドに量子化済みの値を入れる。
EDL: list[tuple[str, int, int, str]] = [
    ("clips/c01.mp4", 12, 113, "Intro 静 / 2小節長回し"),
    ("clips/c02.mp4",  6,  56, "Verse1 L1"),
    ("clips/c03.mp4",  0,  56, "Verse1 L2"),
    # ...
]
BLACKS: list[tuple[int, int]] = [
    # (挿入位置のEDLインデックス, 黒フレーム数) 静寂点に着地させる
    # (12, 28),
]
# ============================================================================


def check() -> int:
    """尺の検算。組む前に必ず通す。"""
    total = sum(d for _, _, d, _ in EDL) + sum(n for _, n in BLACKS)
    print(f"EDL cuts        : {len(EDL)}")
    print(f"EDL total frames: {total}")
    print(f"audio frames    : {TOTAL_FRAMES}")
    diff = total - TOTAL_FRAMES
    if diff == 0:
        print("OK: 尺一致")
        return 0
    print(f"NG: {diff:+d} frames ({diff / FPS:+.3f}s) — 最終カットの末尾で吸収すること")
    return 1


def build_filter() -> tuple[list[str], str]:
    """入力リストと filter_complex を組み立てる。"""
    inputs: list[str] = []
    parts: list[str] = []
    labels: list[str] = []

    for i, (src, src_in, dur, _note) in enumerate(EDL):
        inputs += ["-i", src]
        lbl = f"v{i}"
        parts.append(
            # fps正規化 → 解像度統一 → フレーム指定trim の順。順序を変えるとズレる。
            f"[{i}:v]fps={FPS},"
            f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2,setsar=1,"
            # end_frame は exclusive。in + dur をそのまま渡す。
            f"trim=start_frame={src_in}:end_frame={src_in + dur},"
            f"setpts=PTS-STARTPTS[{lbl}]"
        )
        labels.append(lbl)

    # 暗転を差し込む（color source を追加入力として生成）
    for k, (idx, nframes) in enumerate(BLACKS):
        lbl = f"b{k}"
        parts.append(
            f"color=c=black:s={W}x{H}:r={FPS}:d={nframes / FPS:.6f},"
            f"trim=start_frame=0:end_frame={nframes},setsar=1,"
            f"setpts=PTS-STARTPTS[{lbl}]"
        )
        labels.insert(idx + k, lbl)

    chain = "".join(f"[{l}]" for l in labels)
    parts.append(f"{chain}concat=n={len(labels)}:v=1:a=0[vout]")
    return inputs, ";".join(parts)


def build() -> int:
    if check() != 0:
        print("尺が合っていないのでビルドを中止する。")
        return 1

    inputs, fc = build_filter()
    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + ["-i", AUDIO]
        + [
            "-filter_complex", fc,
            "-map", "[vout]",
            "-map", f"{len(EDL)}:a",
            "-c:v", "libx264", "-crf", "18", "-preset", "slow",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-c:a", "aac", "-b:a", "320k",
            "-shortest",
            OUT,
        ]
    )
    print(" ".join(cmd[:6]), "... (filter_complex 省略)")
    return subprocess.call(cmd)


def verify() -> int:
    """Phase 7-1: 実測検証。設計値と一致しなければ組み直す。"""
    nb = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
         "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", OUT],
        capture_output=True, text=True,
    ).stdout.strip()
    print(f"actual frames : {nb}")
    print(f"design frames : {TOTAL_FRAMES}")
    ok = nb.isdigit() and int(nb) == TOTAL_FRAMES
    print("OK: フレーム数一致" if ok else "NG: フレーム数不一致")

    print("\n--- blackdetect（設計暗転位置と±1frame以内で一致すること）---")
    bd = subprocess.run(
        ["ffmpeg", "-i", OUT, "-vf", "blackdetect=d=0.3:pic_th=0.98", "-an", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    for line in bd.splitlines():
        if "blackdetect" in line:
            print(line.strip())
    return 0 if ok else 1


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="EDL検算のみ")
    ap.add_argument("--verify", action="store_true", help="出力の実測検証")
    args = ap.parse_args()

    if args.check:
        sys.exit(check())
    if args.verify:
        sys.exit(verify())
    sys.exit(build())


if __name__ == "__main__":
    main()
