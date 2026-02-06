import pandas as pd
import re

def analyze_unclassified():
    df = pd.read_csv('data/star_bucks_store_utf.csv')
    df = df.rename(columns={'매장명': 'store_name', '주소': 'address'})
    seoul_df = df[df['address'].str.contains('서울', na=False)].copy()

    unclassified_list = []
    
    # 3. 주소에서 '구'와 '동'을 추출하는 함수 (기본 로직 복사)
    def extract_location(addr):
        addr = re.sub(r'1522-3232', '', addr)
        parts = addr.split()
        
        gu = "미분류"
        for part in parts:
            if part.endswith('구'):
                gu = part
                break
        
        dong = "미분류"
        dong_match = re.search(r'\(([^)]+동)[^)]*\)', addr)
        if dong_match:
            dong = dong_match.group(1)
        else:
            for part in parts:
                if part.endswith('동') and not part.endswith('구') and not part.endswith('시'):
                    dong = part
                    break
                    
        # normalization
        dong = re.sub(r'[0-9·.]+', '', dong)
        dong = re.sub(r'가$', '', dong)
        
        return gu, dong

    # Analyze
    for idx, row in seoul_df.iterrows():
        gu, dong = extract_location(row['address'])
        if gu == "미분류" or dong == "미분류" or dong == "":
            # Try deeper analysis
            suggestion = ""
            
            # Case 1: road name contains hint (e.g., "Myeongdong 10-gil")
            if "명동" in row['address']: suggestion = "명동"
            elif "을지로" in row['address']: suggestion = "을지로"
            elif "종로" in row['address']: suggestion = "종로"
            elif "세종대로" in row['address']: suggestion = "세종로" # Sejong-ro is legally a dong often
            elif "퇴계로" in row['address']: suggestion = "회현동/충무로/명동 추정"
            
            unclassified_list.append({
                "store_name": row['store_name'],
                "address": row['address'],
                "current_gu": gu,
                "current_dong": dong,
                "suggestion": suggestion
            })

    print(f"Total Unclassified: {len(unclassified_list)}")
    for item in unclassified_list:
        print(f"[{item['store_name']}] {item['address']} -> Gu:{item['current_gu']} Dong:{item['current_dong']} (Sugg: {item['suggestion']})")

if __name__ == "__main__":
    analyze_unclassified()
