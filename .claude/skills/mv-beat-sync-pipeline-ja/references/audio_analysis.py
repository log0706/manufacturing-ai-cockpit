#!/usr/bin/env python3
"""Phase 1: 音源解析.

BPM・ビートグリッド・RMS推移・静寂点・構造境界候補を実測して出力する。
後続フェーズ（EDL設計）はここで出た数値だけを参照すること。

Usage:
    pip install librosa numpy soundfile
    python audio_analysis.py song.wav --fps 30
"""

import argparse
import json

import librosa
import numpy as np


def analyze(path: str, fps: int = 30, hop_s: float = 0.1) -> dict:
    y, sr = librosa.load(path, sr=None, mono=True)
    duration = len(y) / sr

    # --- BPM とビート位置（実測） ---
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    offset = float(beat_times[0]) if len(beat_times) else 0.0
    beat_period = 60.0 / bpm

    # グリッド式の実測誤差（後半でズレていないかの確認用）
    if len(beat_times) > 1:
        ideal = offset + np.arange(len(beat_times)) * beat_period
        drift = beat_times - ideal
        drift_max = float(np.max(np.abs(drift)))
        drift_end = float(drift[-1])
    else:
        drift_max = drift_end = 0.0

    # --- RMS推移 ---
    hop = max(1, int(sr * hop_s))
    rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
    rms_times = np.arange(len(rms)) * hop / sr
    rms_db = librosa.amplitude_to_db(rms + 1e-10, ref=np.max(rms) + 1e-10)

    # --- 静寂点（谷）: 暗転の着地候補 ---
    thresh = float(np.percentile(rms, 12))
    quiet = rms < thresh
    silences = []
    i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * hop_s >= 0.3:  # 0.3s以上続く谷のみ採用
                seg = rms[i:j]
                center = i + int(np.argmin(seg))
                silences.append(round(float(rms_times[center]), 3))
            i = j
        else:
            i += 1

    # --- 構造境界候補（自己相似からのセグメント検出） ---
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    bounds = librosa.segment.agglomerative(chroma, k=8)
    bound_times = [round(float(t), 3) for t in librosa.frames_to_time(bounds, sr=sr)]

    return {
        "file": path,
        "duration_s": round(duration, 3),
        "fps": fps,
        "total_frames": int(round(duration * fps)),
        "bpm": round(bpm, 3),
        "offset_s": round(offset, 3),
        "beat_period_s": round(beat_period, 5),
        "bar_s_4_4": round(beat_period * 4, 5),
        "grid_formula": f"t(n) = {offset:.3f} + n * {beat_period:.5f}",
        "grid_drift_max_s": round(drift_max, 4),
        "grid_drift_at_end_s": round(drift_end, 4),
        "beat_count": int(len(beat_times)),
        "silence_points_s": silences,
        "section_bounds_s": bound_times,
        "rms_peak_s": round(float(rms_times[int(np.argmax(rms))]), 3),
        "rms_db_min": round(float(np.min(rms_db)), 2),
    }


def frame_of(t: float, fps: int) -> int:
    """秒 → フレーム番号（EDL用。必ず四捨五入で整数化する）."""
    return int(round(t * fps))


def grid_frames(result: dict, n_max: int = 64) -> list[int]:
    """ビートグリッド上のフレーム番号一覧（カット境界の候補）."""
    off, per, fps = result["offset_s"], result["beat_period_s"], result["fps"]
    return [frame_of(off + n * per, fps) for n in range(n_max)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--json", help="解析結果の保存先")
    args = ap.parse_args()

    r = analyze(args.audio, fps=args.fps)

    print("=== Phase 1: 音源解析 ===")
    for k in ("duration_s", "total_frames", "bpm", "offset_s", "beat_period_s",
              "bar_s_4_4", "grid_formula", "beat_count"):
        print(f"{k:22s}: {r[k]}")
    print(f"{'grid drift (max/end)':22s}: {r['grid_drift_max_s']}s / {r['grid_drift_at_end_s']}s")
    if r["grid_drift_max_s"] > 0.05:
        print("  ⚠ ドリフトが1.5frame超。前半/後半で別グリッドを持つことを検討する。")
    print(f"{'静寂点 (暗転候補)':22s}: {r['silence_points_s']}")
    print(f"{'構造境界候補':22s}: {r['section_bounds_s']}")
    print(f"{'RMSピーク':22s}: {r['rms_peak_s']}s")
    print("\n--- ビートグリッド frame（先頭32拍） ---")
    print(grid_frames(r, 32))

    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(r, f, ensure_ascii=False, indent=2)
        print(f"\nsaved: {args.json}")


if __name__ == "__main__":
    main()
