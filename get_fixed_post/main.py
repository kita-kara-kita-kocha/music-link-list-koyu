import requests
import os
import json
import time

# ターミナルで以下の行を実行して環境変数を設定してください:
# export BEARER_TOKEN='<your_bearer_token>'
bearer_token = os.environ.get("BEARER_TOKEN")
# 環境変数が設定されていない場合は以下の行を有効にしてください:
# bearer_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 参照するユーザーのuser name
user_name = "koyuchan_"

# 2日前の時間を"2021-01-01T00:00:00Z"の文字列形式で取得
start_time = {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(time.time() - 60 * 60 * 24 * 2))}

def create_url_get_user_pinned_post():
    """
    ユーザーのピン留めされたリストを取得するためのURLを作成します。

    Returns:
        (string) ユーザーのピン留めされたリストを取得するためのURL
    """
    user_fields = "pinned_tweet_id"
    url = "https://api.twitter.com/2/users/by/username/{}".format(user_name)
    return {
        "api": "get_user_pinned_post",
        "url": url, 
        "params": {
            "user.fields": user_fields
        }
    }

def create_url_get_user_timeline():
    """
    ユーザータイムラインを取得するためのURLを作成します。

    Returns:
        (string) ユーザータイムラインを取得するためのURL
    """
    user_id = 1361995549474312194
    return {
        "api": "get_user_timeline",
        "url": "https://api.twitter.com/2/users/{}/tweets".format(user_id),
        "params": {
            "tweet.fields": "id,referenced_tweets",
            "start_time": start_time,
            "max_results": 15
        }
    }

def create_url_get_post_by_postid(post_id):
    """
    ツイートIDを指定してツイートを取得するためのURLを作成します。

    Returns:
        (string) ツイートを取得するためのURL
    """
    return {
        "api": "get_post_by_postid",
        "url": "https://api.twitter.com/2/tweets/{}".format(post_id),
        "params": {
            "tweet.fields": "created_at,text"
        }
    }

def bearer_oauth(r):
    """
    OAuth 2.0 Bearerトークンをリクエストに追加します。

    Args:
        r: (requests.models.PreparedRequest) リクエスト
    
    Returns:
        r: (requests.models.PreparedRequest) リクエスト
    """
    r.headers["Authorization"] = f"Bearer {bearer_token}"
    r.headers["User-Agent"] = "v2UserTweetsPython"
    return r

def connect_to_endpoint(api, url, params):
    """
    Twitterエンドポイントにリクエストを送信します。

    Args:
        api: (string) リクエストを送信するAPI
        url: (string) リクエストを送信するエンドポイント
        params: (dict) リクエストパラメータ

    Returns:
        (json) APIレスポンス
    """
    last_request_time = None
    if os.path.exists("last_request_time.txt"):
        with open("last_request_time.txt", "r") as f:
            for line in f:
                if api == line.split(":::")[0]:
                    last_request_time = float(line.split(":::")[1])
                    break
            f.close()
        if last_request_time and time.time() - last_request_time < 900:
            wait_second = 900 - (time.time() - last_request_time)
            wait_second = round(wait_second, 0)
            print(f'前回のリクエストから15分経過していません。{wait_second}秒待機します。{time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time()))}~{time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + wait_second))}')
            time.sleep(wait_second + 1)
    else:
        with open("last_request_time.txt", "w") as f:
            f.write(f"{api}:::{time.time()}\n")
            f.close()
    # api名とリクエスト時間を記録
    # ファイルが存在しない場合は新規作成
    # api名が存在しない場合は追記
    # api名が存在する場合はその行だけ上書き
    with open("last_request_time.txt", "r") as f:
        lines = f.readlines()
        f.close()
    with open("last_request_time.txt", "w") as f:
        for line in lines:
            if api != line.split(":::")[0]:
                f.write(line)
        f.write(f"{api}:::{time.time()}\n")
        f.close()
    response = requests.request("GET", url, auth=bearer_oauth, params=params)
    print(f'レスポンスコード：{response.status_code}')
    if response.status_code == 429:
        connect_to_endpoint(api, url, params)
    elif response.status_code != 200:
        raise Exception(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
        )
    return response.json()

def decode_string(rawstring):
    """
    引数配列内dictのtextに含まれる文字列をそれぞれ参照し、その文字列に含まれるUnicodeエスケープシーケンスを通常テキストにデコードします。

    Args:
        data: (list) デコードする文字列を含むdictの配列
    
    Returns:
        (list) デコードされた文字列を含むdictの配列
    """
    # Unicodeエスケープシーケンスを抽出
    for j in range(len(rawstring)):
        if rawstring[j] == "\\" and rawstring[j + 1] == "u":
            # Unicodeエスケープシーケンスを取得
            unicode_escape_sequence = rawstring[j:j + 6]
            # Unicodeエスケープシーケンスを通常テキストにデコード
            encoded_string = unicode_escape_sequence.encode().decode('unicode-escape')
            # デコードされた文字列を元の文字列に置換
            rawstring = rawstring.replace(unicode_escape_sequence, encoded_string)
    return rawstring

# 引数のjson_response内のdataに含まれるtextをデコード
def encode_json_response(json_response):
    """
    引数dictのdata(配列)内のtextに含まれる文字列をそれぞれ参照し、その文字列に含まれる通常テキストをUnicodeエスケープシーケンスにエンコードします。
    
    Args:
        json_response: (dict) デコードする文字列を含むdict

    Returns:
        (dict) デコードされた文字列を含むdict
    """
    # data内のtextに含まれる文字列をデコード
    for i in range(len(json_response["data"])):
        # textが含まれるdictのtextをデコード
        json_response["data"][i]['text'] = decode_string(json_response["data"][i]['text'])
    print(json_response["data"][-1]['text'])
    print(json.dumps(json_response["data"][-1], indent=4, sort_keys=True))
    return json_response

def request_and_save_json_response(aup: dict):
    """
    引数のURLにリクエストを送信し、レスポンスをjson形式で保存します。

    Args:
        aup: (dict) リクエストを送信するAPIのURLとパラメータ

    Returns:
        (dict) レスポンス
    """
    json_response = connect_to_endpoint(aup["api"], aup["url"], aup["params"])
    # レスポンスをjson形式で保存
    with open(f'get_fixed_post/{aup["api"]}.json', "w") as f:
        json.dump(json_response, f, ensure_ascii=False, indent=4, sort_keys=True)
        f.close()
    return json_response

def create_blockquote(user_id, post_id):
    """
    引数のユーザーIDとツイートIDを参照し、ツイートを埋め込むためのblockquoteタグを生成します。
    ※https://publish.twitter.com/oembedを使用

    Args:
        user_id: (string) ユーザーID
        post_id: (string) ツイートID

    Returns:
        (string) 生成したblockquoteタグ
    """
    publish_url = "https://publish.twitter.com/oembed"
    params = {
        "url": f'https://twitter.com/{user_id}/status/{post_id}',
        "hide_media": False,
        "align": "center",
    }
    response = requests.get(publish_url, params=params)
    embed_data = json.loads(response.text)
    # scriptタグを削除
    blockquote = embed_data["html"].replace("<script async src=\"https://platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>", "")
    return blockquote.replace("\n", "")

def create_blockquotes(tweets:list):
    """
    引数の配列から、ツイートを埋め込むためのblockquoteタグ(string)のリストを生成します。

    Args:
        tweets: (list) ツイートデータを含むdictの配列
        {
            :
            id:(string),
            :
            referenced_tweets: [
                {
                    type:(string), 
                    :
                }
            ],
            :
        }

    Returns:
        (list) 生成したblockquoteタグ(string)のリスト
    """
    blockquotes = []
    for tweet in tweets:
        # ツイートがリプライの場合はスキップ
        if "referenced_tweets" in tweet.keys() and tweet["referenced_tweets"][0]["type"] == "replied_to":
            continue
        blockquote = create_blockquote(user_name, tweet["id"])
        # 改行を排除
        blockquote = blockquote
        blockquotes.append(blockquote)
    return blockquotes

def create_html(blockquotes):
    """
    引数のblockquotesを参照し、テンプレートファイルを読み込み、blockquotesを埋め込んでdocs/index.htmlに保存します。

    Args:
        blockquotes: (list) ツイートを埋め込むためのblockquoteタグ(string)のリスト
    """
    with open("get_fixed_post/index.html.template", "r") as f:
        template = f.read()
        f.close()
    blockquotes = "\n        ".join(blockquotes)
    html = template.replace("${blockquotes}", blockquotes)
    with open("docs/index.html", "w") as f:
        f.write(html)
        f.close()

def main():
    json_response = request_and_save_json_response(create_url_get_user_pinned_post())
    # with open("get_fixed_post/get_user_pinned_post.json", "r") as f:
    #     json_response = json.load(f)
    #     f.close()
    pinned_tweet_id = json_response["data"]["pinned_tweet_id"]

    blockquotes = []
    timeline_tweets = request_and_save_json_response(create_url_get_user_timeline())["data"]
    # with open("get_fixed_post/get_user_timeline.json", "r") as f:
    #     timeline_tweets = json.load(f)["data"]
    #     f.close()
    blockquotes.append(create_blockquote(user_name, pinned_tweet_id))
    blockquotes.extend(create_blockquotes(timeline_tweets))
    create_html(blockquotes)
    print("done")

def test():
    print("test")


if __name__ == "__main__":
    main()
    # test()
