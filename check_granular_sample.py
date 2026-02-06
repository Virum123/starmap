import sqlite3
conn = sqlite3.connect('starbucks.db')
cur = conn.cursor()
print("Sample Sanggye Stores:")
cur.execute("SELECT store_name, dong FROM stores WHERE address LIKE '%상계%' LIMIT 5")
for r in cur.fetchall():
    print(r)
print("\nSample Wolgye Stores:")
cur.execute("SELECT store_name, dong FROM stores WHERE address LIKE '%월계%' LIMIT 5")
for r in cur.fetchall():
    print(r)
conn.close()
