"""Generate synthetic sales dataset for the AI Data Analyst demo.

Run: python generate_sample_data.py
Outputs: data/sample_sales.csv (~1000 rows)
"""

import csv
import random
import os
from datetime import datetime, timedelta

random.seed(42)

REGIONS = ["North", "South", "East", "West", "Central"]
PRODUCTS = [
    "Laptop", "Monitor", "Keyboard", "Mouse", "Headphones",
    "Webcam", "Desk Chair", "Standing Desk", "USB Hub", "External SSD",
]
CUSTOMERS = [f"CUST-{i:04d}" for i in range(1, 101)]

START_DATE = datetime(2023, 1, 1)
END_DATE = datetime(2024, 12, 31)
DAYS_RANGE = (END_DATE - START_DATE).days

# Base prices per product
BASE_PRICES = {
    "Laptop": 1200, "Monitor": 450, "Keyboard": 85, "Mouse": 45,
    "Headphones": 150, "Webcam": 95, "Desk Chair": 350,
    "Standing Desk": 600, "USB Hub": 35, "External SSD": 120,
}

# Cost multiplier (cost as fraction of price)
COST_RATIO = {
    "Laptop": 0.65, "Monitor": 0.55, "Keyboard": 0.40, "Mouse": 0.35,
    "Headphones": 0.45, "Webcam": 0.50, "Desk Chair": 0.50,
    "Standing Desk": 0.55, "USB Hub": 0.30, "External SSD": 0.50,
}

# Region-level demand skew (multiplier for quantity)
REGION_DEMAND = {
    "North": 1.3, "South": 1.0, "East": 0.8, "West": 1.1, "Central": 0.9,
}


def generate_rows(n=1000):
    rows = []
    for i in range(1, n + 1):
        region = random.choice(REGIONS)
        product = random.choice(PRODUCTS)
        customer = random.choice(CUSTOMERS)

        # Random date within range
        day_offset = random.randint(0, DAYS_RANGE)
        date = START_DATE + timedelta(days=day_offset)

        # Quantity — skewed by region demand
        base_qty = random.randint(1, 20)
        quantity = max(1, int(base_qty * REGION_DEMAND[region]))

        # Price with ±15% noise
        base_price = BASE_PRICES[product]
        price_noise = random.uniform(0.85, 1.15)
        unit_price = round(base_price * price_noise, 2)
        revenue = round(unit_price * quantity, 2)

        # Cost
        cost = round(unit_price * COST_RATIO[product] * quantity, 2)

        # Inject ~2% anomalies — unrealistically high revenue
        if random.random() < 0.02:
            revenue = round(revenue * random.uniform(8, 15), 2)

        # Inject ~1% nulls in quantity
        qty_val = quantity
        if random.random() < 0.01:
            qty_val = ""

        rows.append({
            "order_id": f"ORD-{i:05d}",
            "date": date.strftime("%Y-%m-%d"),
            "region": region,
            "product": product,
            "customer_id": customer,
            "quantity": qty_val,
            "unit_price": unit_price,
            "revenue": revenue,
            "cost": cost,
        })

    return rows


def main():
    rows = generate_rows(1000)

    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "sample_sales.csv")

    fieldnames = ["order_id", "date", "region", "product", "customer_id",
                  "quantity", "unit_price", "revenue", "cost"]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> {out_path}")


if __name__ == "__main__":
    main()
