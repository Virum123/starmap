import sqlite3
import pandas as pd

conn = sqlite3.connect('starbucks.db')
cur = conn.cursor()

print("Scaling checks for Sanggye-dong:")
cur.execute("SELECT store_name, address FROM stores WHERE address LIKE '%상계%' LIMIT 10")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

print("\nScaling checks for Wolgye-dong:")
cur.execute("SELECT store_name, address FROM stores WHERE address LIKE '%월계%' LIMIT 10")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

conn.close()
