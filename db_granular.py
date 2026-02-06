import json
import sqlite3
import time
from shapely.geometry import shape, Point

def update_db_with_granular_dongs():
    print("Loading GeoJSON...")
    with open('static/seoul_map.geojson', 'r', encoding='utf-8') as f:
        geojson = json.load(f)
    
    # Prepare polygons
    dong_polygons = []
    for feature in geojson['features']:
        # adm_nm: "종로구 사직동", "노원구 월계1동"
        full_name = feature['properties']['adm_nm'] 
        geom = shape(feature['geometry'])
        dong_polygons.append((full_name, geom))
    
    print(f"Loaded {len(dong_polygons)} dong polygons.")

    print("Connecting to DB...")
    conn = sqlite3.connect('starbucks.db')
    cur = conn.execute("SELECT store_name, lat, lng, address FROM stores")
    stores = cur.fetchall()
    
    updated_count = 0
    unknown_count = 0
    
    print(f"Processing {len(stores)} stores...")
    
    updates = []
    
    for store in stores:
        name, lat, lng, addr = store
        if not lat or not lng:
            continue
            
        point = Point(lng, lat) # shapely uses (x, y) = (lng, lat)
        
        matched_dong = None
        
        # Checking polygons
        # Optimization: Filter by Gu first if possible, but parsing adm_nm is fast enough for 400 polygons
        current_gu = addr.split()[1] if len(addr.split()) > 1 and addr.split()[1].endswith('구') else None
        
        found = False
        for dong_full_name, polygon in dong_polygons:
            # dong_full_name ex: "서울특별시 노원구 월계1동" OR "상계1동" depending on geojson
            # Let's check the geojson format. Assuming "Gu Dong" format based on previous knowledge or standard.
            # We will filter polygons that contain the Gu name to speed up (optional but safer)
            
            if current_gu and current_gu not in dong_full_name:
                continue
                
            if polygon.contains(point):
                # Extract just the dong part. 
                # adm_nm usually "서울특별시 노원구 월계1동"
                parts = dong_full_name.split()
                real_dong = parts[-1] # "월계1동"
                
                matched_dong = real_dong
                found = True
                break
        
        if found:
            updates.append((matched_dong, name))
            updated_count += 1
        else:
            # Fallback: keep existing logic or mark as unknown. 
            # If point is slightly outside due to errors, we might want to keep original.
            # But the goal is to be granular.
            # Let's see if we can perform a "nearest" check for edge cases? 
            # For now, let's look at the result.
            unknown_count += 1
            # print(f"Unmatched: {name} ({lat}, {lng}) {addr}")

    print(f"Updating DB: {updated_count} matched, {unknown_count} unmatched.")
    
    if updates:
        conn.executemany("UPDATE stores SET dong = ? WHERE store_name = ?", updates)
        conn.commit()
        print("DB Updated.")
    
    conn.close()

if __name__ == "__main__":
    update_db_with_granular_dongs()
