import pandas as pd
import sqlite3

# CSV 파일 읽기
gu_df = pd.read_csv('seoul_gu_starbucks.csv')
dong_df = pd.read_csv('seoul_dong_starbucks.csv')

# SQLite 데이터베이스 연결
conn = sqlite3.connect('starbucks.db')

# DB로 변환
gu_df.to_sql('gu_stats', conn, if_exists='replace', index=False)
dong_df.to_sql('dong_stats', conn, if_exists='replace', index=False)

conn.close()
print("db생성 완료")