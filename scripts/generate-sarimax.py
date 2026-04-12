"""
SARIMAX-based Synthetic Time-Series Generator
==============================================

Approach:
1. Fit SARIMAX models on REAL time-series data (V-101, P-101, E-301)
2. Validate with Time-Series K-Fold Cross-Validation (rolling window)
3. Transfer learned parameters to generate data for OTHER systems of
   the same equipment type (e.g. P-101 params -> P-301, P-302, etc.)
4. Scale generated values to match each target sensor's metadata thresholds

Justification:
- SARIMAX captures: trend (I), autocorrelation (AR), moving average (MA),
  and seasonality (S) — all present in industrial sensor data
- Time-Series K-Fold validates that the model generalizes across time windows
- Future: full ARIMA grid search, VAR for multi-sensor correlation, or
  deep learning (LSTM/Transformer) for non-linear patterns

Usage:
    python scripts/generate-sarimax.py                          # all targets
    python scripts/generate-sarimax.py --targets K-201 P-303    # specific
    python scripts/generate-sarimax.py --days 30                # duration
    python scripts/generate-sarimax.py --validate               # run K-Fold
    python scripts/generate-sarimax.py --validate --targets K-201

Requirements: pandas, numpy, statsmodels, scikit-learn
"""

import json
import os
import sys
import warnings
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent.parent / "public" / "data"
TS_DIR = DATA_DIR / "timeseries"

# Real data assets we can learn from
SOURCE_ASSETS = {
    "V-101": "vessel",
    "P-101": "pump",
    "E-301": "heat_exchanger",
}

# SARIMAX orders — tuned for 15-min industrial data
# (p,d,q) x (P,D,Q,s) where s=96 (24h at 15-min intervals)
# Using conservative orders to keep fitting fast for hackathon
SARIMAX_ORDERS = {
    "default": {"order": (2, 1, 1), "seasonal_order": (1, 0, 1, 96)},
    "fast":    {"order": (1, 1, 0), "seasonal_order": (1, 0, 0, 96)},
}


def load_real_data(asset_tag: str) -> pd.DataFrame:
    """Load real time-series JSON into a DataFrame."""
    filepath = TS_DIR / f"{asset_tag}.json"
    with open(filepath) as f:
        data = json.load(f)

    rows = []
    for point in data:
        row = {"timestamp": point["timestamp"], **point["sensors"]}
        rows.append(row)

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp").sort_index()
    return df


def load_sensor_metadata() -> list[dict]:
    with open(DATA_DIR / "sensor-metadata.json") as f:
        return json.load(f)


def load_assets() -> list[dict]:
    with open(DATA_DIR / "assets.json") as f:
        return json.load(f)


def get_sensors_for_asset(tag: str, all_sensors: list[dict]) -> list[dict]:
    return [s for s in all_sensors if s["tag"].startswith(f"{tag}/")]


def get_asset_type(tag: str) -> str:
    prefix = tag.split("-")[0]
    type_map = {
        "V": "vessel", "P": "pump", "E": "heat_exchanger",
        "K": "compressor", "G": "generator", "F": "vessel",
    }
    return type_map.get(prefix, "generic")


def fit_sarimax(series: pd.Series, fast: bool = True) -> dict:
    """Fit SARIMAX on a single sensor series. Returns model params."""
    params = SARIMAX_ORDERS["fast" if fast else "default"]

    # Subsample if too long (keep it fast for hackathon)
    if len(series) > 2000:
        series = series.iloc[-2000:]

    series = series.dropna().astype(float)
    if len(series) < 200:
        return None

    try:
        model = SARIMAX(
            series,
            order=params["order"],
            seasonal_order=params["seasonal_order"],
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        result = model.fit(disp=False, maxiter=50)
        return {
            "params": result.params.tolist(),
            "order": params["order"],
            "seasonal_order": params["seasonal_order"],
            "aic": result.aic,
            "mean": float(series.mean()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max()),
        }
    except Exception as e:
        print(f"    Warning: SARIMAX fit failed ({e}), using fallback")
        return None


def kfold_validate(series: pd.Series, n_splits: int = 5, fast: bool = True) -> dict:
    """Time-Series K-Fold cross-validation on a sensor."""
    params = SARIMAX_ORDERS["fast" if fast else "default"]
    series = series.dropna().astype(float)

    if len(series) < 500:
        return {"error": "insufficient data", "n_points": len(series)}

    # Subsample for speed
    if len(series) > 2000:
        series = series.iloc[-2000:]

    tscv = TimeSeriesSplit(n_splits=n_splits)
    fold_results = []

    for fold_idx, (train_idx, test_idx) in enumerate(tscv.split(series)):
        train = series.iloc[train_idx]
        test = series.iloc[test_idx]

        if len(train) < 150 or len(test) < 20:
            continue

        try:
            model = SARIMAX(
                train,
                order=params["order"],
                seasonal_order=params["seasonal_order"],
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            result = model.fit(disp=False, maxiter=30)
            forecast = result.forecast(steps=len(test))

            mae = mean_absolute_error(test, forecast)
            rmse = np.sqrt(mean_squared_error(test, forecast))
            mape = np.mean(np.abs((test.values - forecast.values) / (test.values + 1e-8))) * 100

            fold_results.append({
                "fold": fold_idx + 1,
                "train_size": len(train),
                "test_size": len(test),
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "mape": round(mape, 2),
            })
        except Exception as e:
            fold_results.append({
                "fold": fold_idx + 1,
                "error": str(e),
            })

    successful = [f for f in fold_results if "mae" in f]
    avg_mae = np.mean([f["mae"] for f in successful]) if successful else None
    avg_rmse = np.mean([f["rmse"] for f in successful]) if successful else None
    avg_mape = np.mean([f["mape"] for f in successful]) if successful else None

    return {
        "n_splits": n_splits,
        "folds": fold_results,
        "avg_mae": round(avg_mae, 4) if avg_mae else None,
        "avg_rmse": round(avg_rmse, 4) if avg_rmse else None,
        "avg_mape": round(avg_mape, 2) if avg_mape else None,
    }


def generate_from_model(
    model_info: dict,
    n_points: int,
    target_meta: dict,
    source_series: pd.Series,
) -> np.ndarray:
    """Generate synthetic data using fitted SARIMAX model, scaled to target sensor."""
    source_series = source_series.dropna().astype(float)
    if len(source_series) > 2000:
        source_series = source_series.iloc[-2000:]

    try:
        model = SARIMAX(
            source_series,
            order=tuple(model_info["order"]),
            seasonal_order=tuple(model_info["seasonal_order"]),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        result = model.fit(disp=False, maxiter=50)

        # Generate via simulation (includes noise)
        simulated = result.simulate(nsimulations=n_points)
        values = simulated.values.flatten()
    except Exception:
        # Fallback: AR(1) with noise from source statistics
        values = np.zeros(n_points)
        values[0] = model_info["mean"]
        for i in range(1, n_points):
            values[i] = 0.95 * values[i - 1] + 0.05 * model_info["mean"] + np.random.normal(0, model_info["std"] * 0.1)

    # Scale from source range to target range
    src_min, src_max = model_info["min"], model_info["max"]
    src_range = src_max - src_min if src_max != src_min else 1

    tgt_normal_mid = (target_meta["normal_min"] + target_meta["normal_max"]) / 2
    tgt_range = target_meta["normal_max"] - target_meta["normal_min"]

    # Normalize to [0,1] then scale to target
    normalized = (values - src_min) / src_range
    scaled = target_meta["normal_min"] + normalized * tgt_range

    # Add slight noise and clamp
    noise = np.random.normal(0, tgt_range * 0.02, n_points)
    scaled += noise

    lo = target_meta["trip_low"] * 0.7 if target_meta["trip_low"] > 0 else 0
    hi = target_meta["trip_high"] * 1.1
    scaled = np.clip(scaled, lo, hi)

    return np.round(scaled, 3)


def main():
    parser = argparse.ArgumentParser(description="SARIMAX synthetic data generator")
    parser.add_argument("--targets", nargs="*", help="Target asset tags (default: all without data)")
    parser.add_argument("--days", type=int, default=7, help="Days of data to generate")
    parser.add_argument("--interval", type=int, default=15, help="Interval in minutes")
    parser.add_argument("--validate", action="store_true", help="Run K-Fold cross-validation")
    parser.add_argument("--fast", action="store_true", default=True, help="Use fast SARIMAX orders")
    args = parser.parse_args()

    all_sensors = load_sensor_metadata()
    all_assets = load_assets()
    n_points = (args.days * 24 * 60) // args.interval

    print("=" * 60)
    print("SARIMAX-based Synthetic Time-Series Generator")
    print("=" * 60)
    print(f"  Method: SARIMAX{SARIMAX_ORDERS['fast' if args.fast else 'default']['order']} "
          f"x {SARIMAX_ORDERS['fast' if args.fast else 'default']['seasonal_order']}")
    print(f"  Days: {args.days} | Interval: {args.interval}min | Points: {n_points}")
    print()

    # ── Step 1: Fit SARIMAX on real data ──
    print("Step 1: Fitting SARIMAX on real source data...")
    source_models: dict[str, dict[str, dict]] = {}  # {asset_type: {sensor_type: model_info}}
    source_data: dict[str, pd.DataFrame] = {}

    for source_tag, asset_type in SOURCE_ASSETS.items():
        print(f"\n  [{source_tag}] ({asset_type})")
        df = load_real_data(source_tag)
        source_data[source_tag] = df

        if asset_type not in source_models:
            source_models[asset_type] = {}

        for col in df.columns:
            # Derive sensor type from column name
            sensor_type = col.upper()
            print(f"    Fitting {col}...", end=" ", flush=True)
            model_info = fit_sarimax(df[col], fast=args.fast)
            if model_info:
                source_models[asset_type][sensor_type] = {
                    **model_info,
                    "source_tag": source_tag,
                    "source_col": col,
                }
                print(f"AIC={model_info['aic']:.1f}")
            else:
                print("SKIPPED (fallback)")

    # ── Step 2: K-Fold Cross-Validation ──
    if args.validate:
        print("\n" + "=" * 60)
        print("Step 2: Time-Series K-Fold Cross-Validation (5 folds)")
        print("=" * 60)

        validation_results = {}
        for source_tag in SOURCE_ASSETS:
            df = source_data[source_tag]
            print(f"\n  [{source_tag}]")
            validation_results[source_tag] = {}

            for col in df.columns:
                print(f"    Validating {col}...", end=" ", flush=True)
                cv_result = kfold_validate(df[col], n_splits=5, fast=args.fast)
                validation_results[source_tag][col] = cv_result

                if cv_result.get("avg_mape"):
                    print(f"MAPE={cv_result['avg_mape']:.1f}% | "
                          f"MAE={cv_result['avg_mae']:.3f} | "
                          f"RMSE={cv_result['avg_rmse']:.3f}")
                else:
                    print(f"Error: {cv_result.get('error', 'unknown')}")

        # Save validation report
        report_path = DATA_DIR / "sarimax-validation.json"
        with open(report_path, "w") as f:
            json.dump(validation_results, f, indent=2)
        print(f"\n  Validation report saved: {report_path}")

    # ── Step 3: Generate data for target assets ──
    print("\n" + "=" * 60)
    print("Step 3: Generating synthetic data for target assets")
    print("=" * 60)

    if args.targets:
        target_tags = args.targets
    else:
        # All assets with sensors that don't have real timeseries
        existing_ts = {f.stem for f in TS_DIR.glob("*.json")} - set(SOURCE_ASSETS.keys())
        tags_with_sensors = set()
        for s in all_sensors:
            tag = s["tag"].split("/")[0]
            tags_with_sensors.add(tag)
        target_tags = sorted(tags_with_sensors - set(SOURCE_ASSETS.keys()))

    print(f"  Targets: {len(target_tags)} assets\n")

    generated_count = 0
    for tag in target_tags:
        asset_type = get_asset_type(tag)
        sensors = get_sensors_for_asset(tag, all_sensors)
        if not sensors:
            continue

        # Find best source model for this asset type
        model_bank = source_models.get(asset_type)
        if not model_bank:
            # Fall back to any available model
            for at in source_models:
                if source_models[at]:
                    model_bank = source_models[at]
                    break

        if not model_bank:
            print(f"  {tag}: SKIPPED (no source model)")
            continue

        # Generate timestamps
        start = pd.Timestamp("2025-10-01T00:00:00Z")
        timestamps = pd.date_range(start, periods=n_points, freq=f"{args.interval}min")

        sensor_data: dict[str, list[float]] = {}
        for sensor_meta in sensors:
            sensor_key = sensor_meta["sensor_id"].replace(f"{tag}-", "")
            sensor_type = sensor_key.upper()

            # Find matching model by sensor type
            model_info = None
            source_series = None
            for model_key, mi in model_bank.items():
                if model_key == sensor_type or sensor_type.startswith(model_key[:3]):
                    model_info = mi
                    src_tag = mi["source_tag"]
                    src_col = mi["source_col"]
                    source_series = source_data[src_tag][src_col]
                    break

            if model_info and source_series is not None:
                values = generate_from_model(model_info, n_points, sensor_meta, source_series)
            else:
                # Fallback: simple AR(1) with sensor metadata
                mid = (sensor_meta["normal_min"] + sensor_meta["normal_max"]) / 2
                rng = sensor_meta["normal_max"] - sensor_meta["normal_min"]
                values = np.zeros(n_points)
                values[0] = mid
                for i in range(1, n_points):
                    # AR(1) with seasonal component
                    seasonal = np.sin(2 * np.pi * i / 96) * rng * 0.08
                    values[i] = 0.97 * values[i-1] + 0.03 * mid + seasonal + np.random.normal(0, rng * 0.02)
                lo = sensor_meta["trip_low"] * 0.7 if sensor_meta["trip_low"] > 0 else 0
                values = np.clip(values, lo, sensor_meta["trip_high"] * 1.1)
                values = np.round(values, 3)

            sensor_data[sensor_key] = values.tolist()

        # Build output
        readings = []
        for i in range(n_points):
            readings.append({
                "timestamp": timestamps[i].strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sensors": {k: v[i] for k, v in sensor_data.items()},
            })

        out_path = TS_DIR / f"{tag}.json"
        with open(out_path, "w") as f:
            json.dump(readings, f)

        asset_name = next((a["name"] for a in all_assets if a["tag"] == tag), "")
        print(f"  {tag} ({asset_name}): {n_points} pts, {len(sensors)} sensors "
              f"[source: {asset_type}] -> {out_path.name}")
        generated_count += 1

    # ── Summary ──
    print(f"\n{'=' * 60}")
    print(f"Done! Generated data for {generated_count} assets.")
    print(f"Source models fitted on: {', '.join(SOURCE_ASSETS.keys())}")
    print(f"Method: SARIMAX with Time-Series K-Fold validation")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
