

import subprocess
import sys
import json
import codecs

# 実行コマンド
# python link_chk_single.py

# yt-dlpのインストール
# pip install yt-dlp

def get_video_info(video_url):
    """
    プレイリストの動画リンクを取得する関数

    Returns:
        list: プレイリストの動画リンクのリスト
    """
    # yt-dlpのパス
    yt_dlp_path = "yt-dlp"
    # yt-dlpの実行
    cmd = [yt_dlp_path, "-j", video_url]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    upload_date = json.loads(result.stdout)["upload_date"]
    upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
    return upload_date


def main():
    # 
    # 動画のURL
    video_url = "https://www.youtube.com/watch?v=1_HoN5cvGLk"
    print(get_video_info(video_url))

if __name__ == "__main__":
    main()

