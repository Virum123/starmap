import sqlite3
conn = sqlite3.connect('starbucks.db')
cur = conn.cursor()
cur.execute("SELECT store_name, address FROM stores WHERE dong='미분류' OR gu='미분류'")
res = cur.fetchall()
print(f'Unclassified Remaining: {len(res)}')
for r in res:
    print(f'- {r[0]}: {r[1]}')
conn.close()
