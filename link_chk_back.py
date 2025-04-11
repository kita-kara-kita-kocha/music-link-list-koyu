

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

# yt-dlpのパス
yt_dlp_path = "yt-dlp"

# プレイリスト外の動画リンクを定義
add_skip_links = [
    "https://www.youtube.com/watch?v=zq-4gCilj5M",
    "https://www.youtube.com/watch?v=O7qH1VIuEc8",
    "https://www.youtube.com/live/M5UhfHMu8y8",
    "https://www.youtube.com/watch?v=jiQVSs_Whd8",
    "https://www.youtube.com/watch?v=ALjV_YsrNI8",
    "https://www.youtube.com/watch?v=W0Lj-WyMTCc",
    "https://www.youtube.com/watch?v=p_XXqtILG5g",
    "https://www.youtube.com/watch?v=CL7YwXrsnZs",
]

def get_src_url_list():
    """
    src_pathの内容からurlのリストを取得する関数
    returns:
        list: src_pathの内容から取得したurlのリスト

    src_pathの内容
    [
        {
            "title": "${title}",
            "artist": "${artist}",
            "url_date_sets": [
                {
                    "url": "${url}&t=333s",
                    "date": "${date}"
                },
                ...
            ]
        },
        ...
    ]
    """
    # src_pathの内容を取得
    src_list = json.load(open(src_path, "r"))
    # ${url}のリストを取得
    url_list = []
    for src in src_list:
        for url_date_set in src["url_date_sets"]:
            url = url_date_set["url"].split("t=")[0]
            # urlの最後の文字(&か?)を除去
            url = url[:-1]
            # urlのリストに追加
            url_list.append(url)
    # 重複を削除
    url_list = list(set(url_list))
    return url_list


def get_playlist_links():
    """
    プレイリストの動画リンクを取得する関数

    Returns:
        list: プレイリストの動画リンクのリスト
    """
    skip_links = [
        "https://www.youtube.com/watch?v=3MbQvdd9V4U"
    ]
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
        if line_dict["url"] in skip_links:
            continue
        title = line_dict["title"]
        # titleの文字列から、Unicodeエスケープ文字部分をデコード
        title = codecs.decode(title.encode('unicode-escape').decode('utf-8'), 'unicode-escape')

        links.append({"url": line_dict["url"], "title": title})
        # links.append({"title:": link["title"], "url": link["url"]})
    return links

def check_link(link, playlist_links):
    """
    リンクのチェックを行う関数
    引数1のリンクが引数2のget_playlist_linksで取得したリンクリストに含まれているかをチェックする

    Args:
        link (str): チェックするリンク
        playlist_links (list): プレイリストの動画リンクのリスト

    Returns:
        str: リンクが存在しない場合はリンク、存在する場合はNone
    """
    if link in playlist_links:
        return None
    elif link in add_skip_links:
        return None
    else:
        return link

def main():
    # プレイリストの動画リンクを取得
    links = get_playlist_links()
    if links is None:
        print("プレイリストの動画リンクの取得に失敗しました")
        sys.exit(1)
    # src_pathの内容を取得
    src_lists = get_src_url_list()
    # for src_link in src_lists:
    #     print(src_link)
    # リンクのチェック
    for link in src_lists:
        # プレイリストの動画リンクのリストを取得
        playlist_links = [link["url"] for link in links]
        # リンクのチェック
        result = check_link(link, playlist_links)
        if result is not None:
            print(f'{result}')

if __name__ == "__main__":
    main()

