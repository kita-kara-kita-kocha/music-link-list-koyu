#!./usr/bin/env python3
"""
src_list.jsonを以下の3つのファイルに分けて保存するスクリプト

python split_src_list.py

生成ファイル:
- song_list.json: 楽曲リスト [{mng_music_id, title, artist}]
- live_list.json: 配信リスト [{mng_live_id, title, url, date}]
- timestamp_list.json: タイムスタンプリスト [{mng_timestamp_id, mng_music_id, mng_live_id, start_timestamp}]
"""

import json
import re
import yt_dlp
import csv
from urllib.parse import parse_qs, urlparse
from pathlib import Path

# srcファイルのパス
SRC_FILE_PATH = "docs/src_list.json"

def extract_timestamp_from_url(url):
    """URLからタイムスタンプ（秒数）を抽出する"""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    
    if 't' in query_params:
        timestamp_str = query_params['t'][0]
        # 's'が付いている場合は削除
        timestamp_str = timestamp_str.rstrip('s')
        try:
            return int(timestamp_str)
        except ValueError:
            return 0
    return 0


def extract_video_id_from_url(url):
    """YouTubeのURLからビデオIDを抽出する"""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    
    if 'v' in query_params:
        return query_params['v'][0]
    return None


def clean_url(url):
    """URLからタイムスタンプパラメータを除去する"""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    
    # タイムスタンプパラメータを除去
    if 't' in query_params:
        del query_params['t']
    
    # クエリパラメータを再構築
    clean_query = '&'.join([f"{k}={v[0]}" for k, v in query_params.items()])
    
    # URLを再構築
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if clean_query:
        clean_url += f"?{clean_query}"
    
    return clean_url


def get_live_title_and_thumbnail(url, date):
    """配信のタイトルとサムネイルURLを取得する（yt_dlpで確認）"""
    video_id = extract_video_id_from_url(url)
    if video_id:
        with yt_dlp.YoutubeDL() as ydl:
            info = ydl.extract_info(video_id, download=False)
            return info.get('title', ''), info.get('thumbnail', '')
    else:
        return f"Live_{date}", ''


def split_src_list(input_file, output_dir="output", output_csv=True):
    """src_list.jsonを3つのファイルに分割する
    
    Args:
        input_file: 入力ファイルのパス
        output_dir: 出力ディレクトリ
        output_csv: CSVファイルも出力するかどうか
    """
    
    # 出力ディレクトリを作成
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # 入力ファイルを読み込み
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 結果を格納するリスト
    song_list = []
    live_list = []
    timestamp_list = []
    
    # IDカウンタ
    music_id_counter = 1
    live_id_counter = 1
    timestamp_id_counter = 1
    
    # 既に処理したライブ配信のURL（重複排除用）
    processed_lives = {}  # clean_url -> live_id
    
    # データを処理
    for music_data in data:
        title = music_data['title']
        artist = music_data['artist']
        
        # 楽曲リストに追加
        music_entry = {
            'mng_music_id': music_id_counter,
            'title': title,
            'artist': artist
        }
        song_list.append(music_entry)
        current_music_id = music_id_counter
        music_id_counter += 1
        
        # 各配信を処理
        for url_date_set in music_data['url_date_sets']:
            url = url_date_set['url']
            date = url_date_set['date']
            
            # URLからタイムスタンプを抽出
            timestamp = extract_timestamp_from_url(url)
            
            # クリーンなURL（タイムスタンプなし）を取得
            clean_url_str = clean_url(url)
            
            # 既に処理済みの配信かチェック
            if clean_url_str in processed_lives:
                live_id = processed_lives[clean_url_str]
            else:
                # 新しい配信として追加
                live_title, live_thumbnail = get_live_title_and_thumbnail(url, date)
                live_entry = {
                    'mng_live_id': live_id_counter,
                    'title': live_title,
                    'url': clean_url_str,
                    'date': date,
                    'thumbnail': live_thumbnail
                }
                live_list.append(live_entry)
                live_id = live_id_counter
                processed_lives[clean_url_str] = live_id
                live_id_counter += 1
            
            # タイムスタンプリストに追加
            timestamp_entry = {
                'mng_timestamp_id': timestamp_id_counter,
                'mng_music_id': current_music_id,
                'mng_live_id': live_id,
                'start_timestamp': timestamp
            }
            timestamp_list.append(timestamp_entry)
            timestamp_id_counter += 1
    
    # 結果をファイルに保存
    music_file = output_path / 'song_list.json'
    live_file = output_path / 'live_list.json'
    timestamp_file = output_path / 'timestamp_list.json'
    
    # JSON形式で保存
    with open(music_file, 'w', encoding='utf-8') as f:
        json.dump(song_list, f, ensure_ascii=False, indent=2)
    
    with open(live_file, 'w', encoding='utf-8') as f:
        json.dump(live_list, f, ensure_ascii=False, indent=2)
    
    with open(timestamp_file, 'w', encoding='utf-8') as f:
        json.dump(timestamp_list, f, ensure_ascii=False, indent=2)
    
    # CSV形式でも保存
    if output_csv:
        music_csv_file = output_path / 'song_list.csv'
        live_csv_file = output_path / 'live_list.csv'
        timestamp_csv_file = output_path / 'timestamp_list.csv'
        
        # song_listのtitle, artistに入る文字列には、「'」を追加
        for music in song_list:
            music['title'] = f"'{music['title']}"
            music['artist'] = f"'{music['artist']}"
        # live_list.jsonのtitleに入る文字列には、「'」を追加
        for live in live_list:
            live['title'] = f"'{live['title']}"

        # 楽曲リストCSV
        with open(music_csv_file, 'w', encoding='utf-8', newline='') as f:
            if song_list:
                writer = csv.DictWriter(f, fieldnames=song_list[0].keys())
                writer.writeheader()
                writer.writerows(song_list)
        
        # 配信リストCSV
        with open(live_csv_file, 'w', encoding='utf-8', newline='') as f:
            if live_list:
                writer = csv.DictWriter(f, fieldnames=live_list[0].keys())
                writer.writeheader()
                writer.writerows(live_list)
        
        # タイムスタンプリストCSV
        with open(timestamp_csv_file, 'w', encoding='utf-8', newline='') as f:
            if timestamp_list:
                writer = csv.DictWriter(f, fieldnames=timestamp_list[0].keys())
                writer.writeheader()
                writer.writerows(timestamp_list)
    
    # 統計情報を表示
    print(f"処理完了:")
    print(f"  楽曲数: {len(song_list)}")
    print(f"  配信数: {len(live_list)}")
    print(f"  タイムスタンプ数: {len(timestamp_list)}")
    print(f"")
    print(f"出力ファイル (JSON):")
    print(f"  {music_file}")
    print(f"  {live_file}")
    print(f"  {timestamp_file}")
    
    if output_csv:
        print(f"")
        print(f"出力ファイル (CSV):")
        print(f"  {music_csv_file}")
        print(f"  {live_csv_file}")
        print(f"  {timestamp_csv_file}")


if __name__ == "__main__":
    # デフォルトの入力ファイルパス
    input_file = SRC_FILE_PATH

    # ファイルが存在するかチェック
    if not Path(input_file).exists():
        print(f"エラー: {input_file} が見つかりません")
        exit(1)
    
    # 分割処理を実行
    split_src_list(input_file)
