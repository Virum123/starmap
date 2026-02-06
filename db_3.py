import pandas as pd
import sqlite3
import re
import hashlib

def init_detailed_db():
    print("Initializing database with new data...")
    # 1. 원본 CSV 로드
    df = pd.read_csv('data/star_bucks_store_utf.csv')
    
    # 컬럼 이름이 '매장명', '주소', '위도', '경도'라고 가정
    # Renaming for consistency with existing logic
    df = df.rename(columns={
        '매장명': 'store_name',
        '주소': 'address',
        '위도': 'lat',
        '경도': 'lng'
    })

    # 2. 서울특별시 데이터만 추출 (주소에 '서울'이 포함된 경우)
    seoul_df = df[df['address'].str.contains('서울', na=False)].copy()

    # 3. 주소에서 '구'와 '동'을 추출하는 함수
    def extract_location(addr):
        if pd.isna(addr): return "미분류", "미분류"
        # 주소 문자열 정리 (전화번호 등 제거)
        addr = re.sub(r'1522-3232', '', addr)
        
        # [Manual Overrides]
        # 사용자 요청에 따른 수동 매핑
        if '독립문역' in addr or '독립문역' in str(seoul_df.loc[seoul_df['address'] == addr, 'store_name'].values): 
             # Note: extract_location only sees addr usually, but let's check input logic. 
             # Simpler to construct a mapping based on address keywords or store name if possible.
             # Since apply only passes address, relying on unique address substrings or passing row. 
             pass # Will implement inside the iteration or improve apply to use row.
        
        # Better approach: Check specific address patterns for manual override
        if '송월길 155' in addr: return "종로구", "교북동"
        if '한강대로23길 55' in addr: return "용산구", "한강로동"
        if '가로수길 59' in addr: return "강남구", "신사동"

        parts = addr.split()
        # '구' 추출 (보통 두 번째 단어)
        gu = "미분류"
        for part in parts:
            if part.endswith('구'):
                gu = part
                break
        
        # '동' 추출 (괄호 안의 동 이름 우선)
        dong = "미분류"
        # 1. 괄호 안에서 동/로/가 추출
        match = re.search(r'\(([^)]+)\)', addr)
        if match:
            content = match.group(1)
            # 쉼표로 구분된 경우 첫 번째 것 사용 (예: "가산동, 우림...")
            content = content.split(',')[0].strip()
            if content.endswith('동') or content.endswith('로') or content.endswith('가'):
                dong = content
        
        # 2. 괄호 안에 없으면 주소 파트에서 찾기
        if dong == "미분류":
            for part in parts:
                # 쉼표, 괄호 등 제거 후 확인
                clean_part = re.sub(r'[(),]', '', part)
                # "월계동(104호)" -> "월계동" 추출
                match_dong = re.match(r'(.+동)', clean_part)
                if match_dong:
                    candidate = match_dong.group(1)
                    if not candidate.endswith('구') and not candidate.endswith('시') and not candidate.isdigit():
                        dong = candidate
                        break

                if (clean_part.endswith('동') or clean_part.endswith('로') or clean_part.endswith('가')) and \
                   not clean_part.endswith('구') and not clean_part.endswith('시') and not clean_part.isdigit() and \
                   len(clean_part) > 1: # "1로" 같은거 제외
                    dong = clean_part
                    break
        
        # 동 이름 정제 ("월계1동" -> "월계동")
        dong = re.sub(r'[0-9·.]+', '', dong)
        
        if dong == "": dong = "미분류"
        
        return gu, dong

    # 구, 동 컬럼 생성
    locations = seoul_df['address'].apply(extract_location)
    seoul_df['gu'] = locations.apply(lambda x: x[0])
    seoul_df['dong'] = locations.apply(lambda x: x[1])

    # Store Code 생성 (매장명 기반 해시)
    def generate_code(name):
        return int(hashlib.md5(name.encode('utf-8')).hexdigest(), 16) % 1000000

    seoul_df['store_code'] = seoul_df['store_name'].apply(generate_code)

    # 4. SQLite DB 연결 및 테이블 생성
    conn = sqlite3.connect('starbucks.db')
    
    # [stores 테이블]
    stores_df = seoul_df[['store_name', 'store_code', 'gu', 'dong', 'lat', 'lng', 'address']]
    
    
    # 기존 방문 기록 백업 시도
    visited_map = {}
    try:
        cur = conn.execute("SELECT store_name, visited FROM stores")
        for row in cur.fetchall():
            visited_map[row[0]] = row[1]
    except:
        print("No existing visited data found.")

    stores_df.to_sql('stores', conn, if_exists='replace', index=False)
    
    # 복원 및 컬럼 추가
    conn.execute("ALTER TABLE stores ADD COLUMN visited INTEGER DEFAULT 0")
    
    # 방문 기록 복원
    if visited_map:
        print(f"Restoring visited status for {len(visited_map)} stores...")
        for index, row in stores_df.iterrows():
            if row['store_name'] in visited_map:
                conn.execute("UPDATE stores SET visited = ? WHERE store_name = ?", 
                             (visited_map[row['store_name']], row['store_name']))
    
    conn.commit()
    conn.close()
    print("Database updated successfully with star_bucks_store_utf.csv")

if __name__ == '__main__':
    init_detailed_db()
