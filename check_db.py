import sqlite3

conn = sqlite3.connect('starbucks.db')
cursor = conn.cursor()

# 테이블 스키마 확인
print("=== Table Schema ===")
cursor.execute('PRAGMA table_info(stores)')
for row in cursor.fetchall():
    print(row)

# 노원구 데이터에서 실제 dong 값 확인
print("\n=== Sample data from 노원구 ===")
cursor.execute("SELECT gu, dong, store_name FROM stores WHERE gu='노원구' LIMIT 15")
for row in cursor.fetchall():
    print(f"Gu: {row[0]}, Dong: {row[1]}, Store: {row[2]}")

print("\n=== All unique dong names in 노원구 ===")
cursor.execute("SELECT DISTINCT dong FROM stores WHERE gu='노원구' ORDER BY dong")
for row in cursor.fetchall():
    print(row[0])

conn.close()
