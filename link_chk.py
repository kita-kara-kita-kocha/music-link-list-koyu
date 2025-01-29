

import subprocess
import sys
import json
import codecs

# 実行コマンド
# python link_chk.py

# yt-dlpのインストール
# pip install yt-dlp

# プレイリストのURL
playlist_url = "https://www.youtube.com/playlist?list=PLIe6YXszMeXwO4tlvvA96q0BecjXuW1d8"

# こゆ歌リストのjsonファイルパス
src_path = "docs/src_list.json"
# 内容
# [
#     {
#         "title": "${title}",
#         "artist": "${artist}",
#         "url_date_sets": [
#             {
#                 "url": "${url}&t=333s",
#                 "date": "${date}"
#             },
#             ...
#         ]
#     },
#     ...
# ]
src_list = json.load(open(src_path, "r"))

# yt-dlpのパス
yt_dlp_path = "yt-dlp"


def get_playlist_links():
    """
    プレイリストの動画リンクを取得する関数

    Returns:
        list: プレイリストの動画リンクのリスト
    """
    # yt-dlpの実行
    cmd = [yt_dlp_path, "--flat-playlist", "-j", playlist_url]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    # [
    #   {
    #     "_type": "url", 
    #     "ie_key": "Youtube", 
    #     "id": "mz4L5RTQnXw", 
    #     "url": "https://www.youtube.com/watch?v=mz4L5RTQnXw", 
    #     ...
    #    },
    #    ...
    # ]
    if result.returncode != 0:
        print("yt-dlp error")
        print(result.stderr)
        return None
    # urlのみを取得
    links = []
    for line in result.stdout.split("\n"):
        if len(line) == 0:
            continue
        line_dict = json.loads(line)
        if line_dict["live_status"] is None:
            continue
        title = line_dict["title"]
        # titleの文字列から、Unicodeエスケープ文字部分をデコード
        title = codecs.decode(title.encode('unicode-escape').decode('utf-8'), 'unicode-escape')

        links.append(f'{line_dict["url"]} {title}')
        # links.append({"title:": link["title"], "url": link["url"]})
    return links

def check_link(link):
    """
    引数のリンクがsrc_path内のリンクに存在するかチェックする関数

    Args:
        link (str): 確認するリンク
    
    Returns:
        bool: リンクが存在する場合はTrue, それ以外はFalse
    """
    for src in src_list:
        for url_date_set in src["url_date_sets"]:
            if link == url_date_set["url"].split("&t")[0]:
                return True
    return False

def main():
    # プレイリストの動画リンクを取得
    links = get_playlist_links()
    if links is None:
        print("get_playlist_links error")
        sys.exit()
    # リンクのチェック
    for link in links:
        if not check_link(link):
            print(link)

if __name__ == "__main__":
    main()

