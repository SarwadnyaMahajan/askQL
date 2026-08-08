"""Forecast Agent — time-series forecasting using statsmodels.

Detects datetime columns, fits a simple forecast, and returns
predicted values with confidence intervals.
"""

from __future__ import annotations

import json
from typing import Any

import pandas as pd
import numpy as np
from app.services.llm_service import traceable


def detect_time_column(df: pd.DataFrame) -> str | None:

    """Find the most likely datetime column in a DataFrame."""
    # Check existing datetime columns
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            return col

    # Try parsing object columns as dates
    for col in df.select_dtypes(include=["object"]).columns:
        try:
            parsed = pd.to_datetime(df[col], errors="coerce")
            if parsed.notna().sum() > len(df) * 0.8:
                return col
        except Exception:
            continue

    # Check column names for date-like keywords
    date_keywords = {"date", "time", "timestamp", "datetime", "day", "month", "year"}
    for col in df.columns:
        if any(kw in col.lower() for kw in date_keywords):
            try:
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() > len(df) * 0.5:
                    return col
            except Exception:
                continue

    return None


@traceable(name="ForecastAgent", run_type="chain")
def generate_forecast(
    df: pd.DataFrame,
    time_col: str,
    value_col: str,
    periods: int = 12,
) -> dict[str, Any]:
    """Generate a time-series forecast using simple exponential smoothing.

    Args:
        df: Source DataFrame
        time_col: Name of the datetime column
        value_col: Name of the numeric column to forecast
        periods: Number of periods to forecast ahead

    Returns:
        dict with forecast data, or error info.
    """
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
    except ImportError:
        return {
            "success": False,
            "error": "statsmodels not available for forecasting.",
        }

    try:
        # Prepare time series
        ts_df = df[[time_col, value_col]].copy()
        ts_df[time_col] = pd.to_datetime(ts_df[time_col], errors="coerce")
        ts_df = ts_df.dropna()
        ts_df = ts_df.sort_values(time_col)

        if len(ts_df) < 6:
            return {
                "success": False,
                "error": f"Not enough data points for forecasting (need ≥6, got {len(ts_df)}).",
            }

        # Aggregate by detected frequency
        ts_df = ts_df.set_index(time_col)
        # Try to infer frequency
        freq = pd.infer_freq(ts_df.index)
        if freq is None:
            # Resample to monthly if can't infer
            ts_df = ts_df.resample("ME").sum()
            freq = "ME"

        series = ts_df[value_col].astype(float)
        series = series[series.notna()]

        if len(series) < 6:
            return {
                "success": False,
                "error": "Not enough aggregated data points for forecasting.",
            }

        # Fit model
        model = ExponentialSmoothing(
            series,
            trend="add",
            seasonal=None,  # Skip seasonal if not enough data
            initialization_method="estimated",
        )
        fitted = model.fit(optimized=True)

        # Generate forecast
        forecast = fitted.forecast(periods)

        # Simple confidence interval (±1.96 * residual std)
        residuals = fitted.resid
        residual_std = residuals.std()
        ci_lower = forecast - 1.96 * residual_std
        ci_upper = forecast + 1.96 * residual_std

        # Format results
        forecast_data = []
        for i, (date, val) in enumerate(forecast.items()):
            forecast_data.append({
                "date": str(date.date()) if hasattr(date, "date") else str(date),
                "forecast": round(float(val), 2),
                "ci_lower": round(float(ci_lower.iloc[i]), 2),
                "ci_upper": round(float(ci_upper.iloc[i]), 2),
            })

        # Historical data for context
        historical = []
        for date, val in series.tail(24).items():
            historical.append({
                "date": str(date.date()) if hasattr(date, "date") else str(date),
                "actual": round(float(val), 2),
            })

        return {
            "success": True,
            "value_column": value_col,
            "time_column": time_col,
            "frequency": freq,
            "periods_ahead": periods,
            "historical": historical,
            "forecast": forecast_data,
            "model_summary": {
                "aic": round(float(fitted.aic), 2) if hasattr(fitted, "aic") else None,
                "residual_std": round(float(residual_std), 2),
            },
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Forecast failed: {str(e)}",
        }
