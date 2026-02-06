from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

def query_db(query, args=(), one=False):
    conn = sqlite3.connect('starbucks.db')
    conn.row_factory = sqlite3.Row
    cur = conn.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    return (rv[0] if rv else None) if one else rv

@app.route('/')
def index():
    return render_template('index.html')

# 아래 부분 삭제!
# @app.route('/seoul_map.geojson')
# def serve_geojson():
#     return send_from_directory('.', 'seoul_map.geojson')

@app.route('/api/gu-stats')
def get_gu_stats():
    try:
        # sgg (Sub-Governmental Code) is useful for matching if GeoJSON uses codes, 
        # but current GeoJSON mostly uses names. We'll stick to names but cleaner query.
        results = query_db("""
            SELECT 
                gu,
                COUNT(*) as total_stores,
                SUM(CASE WHEN visited = 1 THEN 1 ELSE 0 END) as visited_stores
            FROM stores
            GROUP BY gu
            ORDER BY gu
        """)
        return jsonify([dict(row) for row in results])
    except Exception as e:
        print(f"Error in gu-stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dong-stats')
def get_dong_stats():
    try:
        gu_name = request.args.get('gu')
        dong_name = request.args.get('dong')
        
        args = []
        where_clause = []
        
        query = "SELECT * FROM stores"
        
        if gu_name:
            where_clause.append("gu = ?")
            args.append(gu_name)
            
        if dong_name:
            where_clause.append("dong = ?")
            args.append(dong_name)
            
        if where_clause:
            query += " WHERE " + " AND ".join(where_clause)
            
        query += " ORDER BY gu, dong, store_name"
        
        results = query_db(query, args)
        return jsonify([dict(row) for row in results])
    except Exception as e:
        print(f"Error in dong-stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-visit', methods=['POST'])
def update_visit():
    try:
        data = request.json
        store_code = data.get('store_code')
        visited = 1 if data.get('visited') else 0
        
        query_db("UPDATE stores SET visited = ? WHERE store_code = ?", (visited, store_code))
        
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error in update-visit: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)