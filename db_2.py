import pandas as pd
import sqlite3
import re

def init_detailed_db():
    # 1. 원본 CSV 로드
    df = pd.read_csv('data/kor_starbucks_data.csv')
    
    # 2. 서울특별시 데이터만 추출
    seoul_df = df[df['sido'] == '서울특별시'].copy()

    # 3. 주소에서 '구'와 '동'을 추출하는 함수
    def extract_location(addr):
        if pd.isna(addr): return "미분류", "미분류"
        parts = addr.split()
        # '구' 추출 (보통 두 번째 단어)
        gu = parts[1] if len(parts) > 1 else "미분류"
        
        # '동' 추출 (괄호 안의 동 이름 우선)
        dong_match = re.search(r'\(([^)]+동)\)', addr)
        if dong_match:
            dong = dong_match.group(1)
        else:
            # 괄호가 없으면 마지막으로 '동'으로 끝나는 단어
            dong_list = [p for p in parts if p.endswith('동')]
            dong = dong_list[-1] if dong_list else "미분류"
        return gu, dong

    # 구, 동 컬럼 생성
    seoul_df[['gu', 'dong']] = seoul_df.apply(
        lambda x: pd.Series(extract_location(x['address'])), axis=1
    )

    # 4. SQLite DB 연결 및 테이블 생성
    conn = sqlite3.connect('starbucks.db')
    
    # [stores 테이블] 개별 매장 정보 (방문여부 visited 포함)
    # 필요한 컬럼만 선택하여 저장
    stores_df = seoul_df[['store_name', 'store_code', 'gu', 'dong', 'lat', 'lng']]
    stores_df.to_sql('stores', conn, if_exists='replace', index=False)
    
    # 방문 여부 컬럼 추가 (기본값 0: 미방문)
    try:
        conn.execute("ALTER TABLE stores ADD COLUMN visited INTEGER DEFAULT 0")
    except:
        pass # 이미 컬럼이 있는 경우 무시

    conn.commit()
    conn.close()
    print("성공! 'stores' 테이블이 생성되었습니다.")

if __name__ == '__main__':
    init_detailed_db()