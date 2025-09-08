import re
import requests
import yt_dlp
from push_flask import app
from flask import render_template, request, redirect, url_for, make_response
import datetime
import json
import html

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/link_check', methods=['GET'])
def link_check():
    # GETリクエストのパラメータからbase_api_urlを取得
    api_url = request.args.get('api_url')
    # リンクチェック結果を取得して返す
    return link_check_main(api_url)
    
@app.route('/register', methods=['POST'])
def register():
    title = request.form['title']
    artist = request.form['artist']
    url = request.form['url']
    date = request.form['date']
    commit_json(title, artist, url, date)
    return redirect(url_for('index'))

@app.route('/listPushForm')
def listPushForm():
    return render_template('listform.html')

@app.route('/registerRecord', methods=['POST'])
def listRegister():
    # Content-Typeがapplication/jsonのリクエスト。jsonを受け取る
    data = request.get_json()
    title = html.unescape(data['title'])
    artist = html.unescape(data['artist'])
    url = html.unescape(data['url'])
    date = html.unescape(data['date'])
    try:
        result = commit_json(title, artist, url, date)
        res = make_response({'result': result})
        res.headers['Content-Type'] = 'application/json'
        return res
    except:
        res = make_response({'result': 'error'})
        res.headers['Content-Type'] = 'application/json'
        return res

@app.route('/getUploadDate', methods=['POST'])
def getUploadDate():
    # Content-Typeがapplication/jsonのリクエスト。jsonを受け取る
    data = request.get_json()
    url = html.unescape(data['url'])
    try:
        title, upload_date, thumbnail = get_video_info(video_url=url)
        result = {'title': title, 'upload_date': upload_date, 'thumbnail': thumbnail}
        res = make_response({'result': 'success', 'data': result})
        res.headers['Content-Type'] = 'application/json'
        return res
    except Exception as e:
        print(e)
        res = make_response({'result': 'error'})
        res.headers['Content-Type'] = 'application/json'
        return res

@app.route('/push_to_sheet', methods=['POST'])
def push_to_sheet():
    import requests
    
    data = request.get_json()
    api_url = data['api_url']
    
    payload = {
        'action': 'registerTimestamps',
        'live_url': data['live_url'],
        'title': data['title'],
        'date': data['date'],
        'thumbnail': data['thumbnail'],
        'timestamps': data['timestamps']
    }
    
    try:
        response = requests.post(api_url, json=payload)
        
        # レスポンスが成功でない場合はエラーを返す
        if response.status_code != 200:
            return {'error': f'API request failed with status {response.status_code}', 'response': response.text}
        
        # レスポンステキストが空でないことを確認
        if not response.text.strip():
            return {'error': 'Empty response from API'}

        # JSONパースを試行
        return response.json()
        
    except requests.exceptions.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return {'error': 'Invalid JSON response from API', 'response_text': response.text}
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {'error': 'Request failed', 'details': str(e)}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {'error': 'Unexpected error occurred', 'details': str(e)}

# jsonファイルのパス
json_path = 'docs/src_list.json'

# jsonファイルを読み込む関数
def read_json():
    with open(json_path, 'r', encoding='utf-8') as f:
        src_list = json.load(f)
    return src_list

# jsonファイルを、引数のjsonファイルに書き換える関数
def write_json(json_file):
    # そのままだと代替え文字が入るので、ensure_ascii=Falseを指定
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_file, f, ensure_ascii=False, indent=4)

# titleとartistが一致するものがないか確認
def check_json_music(src_list, title:str, artist:str):
    '''
    処理:titleとartistが一致するものがないか確認
    引数:title, artist
    戻り値:一致するものがあればそのindexを返す。なければ0を返す
    '''
    for index_number in range(len(src_list)):
        src_title:str  = src_list[index_number]['title']
        src_artist:str = src_list[index_number]['artist']
        # 記号を無視して比較
        src_title      = re.sub(r'\W', '', src_title)
        src_artist     = re.sub(r'\W', '', src_artist)
        title          = re.sub(r'\W', '', title)
        artist         = re.sub(r'\W', '', artist)
        # 大文字小文字を無視して比較
        src_title      = src_title.lower()
        src_artist     = src_artist.lower()
        title          = title.lower()
        artist         = artist.lower()

        if src_title == title and src_artist == artist:        
            return index_number
    return -1

# url_date_setsのlistから、dateと一致するdateがあるか確認
def check_json_date(url_date_sets, date):
    '''
    処理:url_date_setsのlistから、dateと一致するdateがあるか確認
    引数:src_list, i, date
    戻り値:一致するものがあればそのindexを返す。なければ0を返す
    '''
    for j in range(len(url_date_sets)):
        if url_date_sets[j]['date'] == date:
            return j
    print(f'dateが一致するものがありません{url_date_sets[j]['date']}, {date}')
    return -1

# git commit関数
def git_commit(msg):
    import subprocess
    subprocess.run(['git', 'add', './docs/src_list.json'])
    subprocess.run(['git', 'commit', '-m', msg])
    return

# json編集関数
def commit_json(title, artist, url, date):
    msg=''
    # jsonファイルの読み込み ../docs/src_list.json
    src_list = read_json()
    # titleとartistが一致するものがないか確認
    i = check_json_music(src_list, title, artist)
    if i != -1:
        # url_date_setsのlistから、dateと一致するdateがあるか確認
        j = check_json_date(src_list[i]['url_date_sets'], date)
        if j == -1:
            # なかった場合はurl_date_setsに追加
            url_date_set = {'url': url, 'date': date}
            src_list[i]['url_date_sets'].append(url_date_set)
            msg = f'{title} / {artist} : 既存楽曲に新しい日付を追加しました'
        else:
            # あった場合はurlを更新
            # 既存のurlと新しいurlが異なる場合のみ更新
            if src_list[i]['url_date_sets'][j]['url'] != url:
                msg = f'{title} / {artist} : 既存楽曲の既存日付のURLを更新しました\n{src_list[i]['url_date_sets'][j]['url']}\n→{url}'
                src_list[i]['url_date_sets'][j]['url'] = url
            else:
                msg = ''
    else:
        # なかった場合は新規追加
        url_date_set = {'url': url, 'date': date}
        src_list.append({'title': title, 'artist': artist, 'url_date_sets': [url_date_set]})
        msg = f'{title} / {artist} : 新しい楽曲を追加しました'
    # 内容に変更があればjsonファイルを書き換えてgit commit
    if msg != '':
        write_json(src_list)
        git_commit(msg)
        return msg
    else:
        return '変更はありませんでした'

def get_video_info(video_url):
    """
    yt_dlpを使って動画のタイトルとアップロード日を取得する関数
    """
    # yt_dlpのオプションを設定
    ydl_opts = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,  # 警告を抑制
        'extract_flat': False,  # 完全な情報を取得
    }
    # yt_dlpを使って動画の情報を取得
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(video_url, download=False)
        title = result.get("title", None)
        thumbnail = result.get("thumbnail", None)
        upload_date = result.get("upload_date", None)
        if upload_date:
            upload_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
    return title, upload_date, thumbnail

def get_playlist_links():
    """
    プレイリストの動画リンクを取得する関数

    Returns:
        list: プレイリストの{タイトル,リンク,アップロード日}のリスト
    """
    # yt_dlpのオプションを設定
    ydl_opts = {
        'extract_flat': True,  # プレイリスト内の動画情報をフラットに取得
        'quiet': True, # 出力を抑制
        'no_warnings': True,  # 警告を抑制
    }
    skip_links = [
        "https://www.youtube.com/watch?v=3MbQvdd9V4U"
    ]
    playlist_links = []
    # プレイリストのURLを取得
    playlist_url = "https://www.youtube.com/playlist?list=PLIe6YXszMeXwO4tlvvA96q0BecjXuW1d8"
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(playlist_url, download=False)
        for entry in result['entries']:
            video_url = entry['url']
            # original_url
            if video_url not in skip_links:
                upload_date = entry.get('release_timestamp', None)
                playlist_links.append({
                    'title': entry.get('title', None),
                    'url': video_url,
                    'upload_date': upload_date
                })
    return playlist_links

def link_check_main(base_api_url):
    """
    get_playlist_links()で取得したリンクから、
    base_api_urlのGETリクエストで取得する、
    data[lives][url]と一致しないリンクを抽出

    Args:
        base_api_url (str): APIのベースURL

    Returns:
        list(dict): 一致しないリンクの情報を含む辞書のリスト
    """
    print('プレイリスト取得中...')
    playlist_links = get_playlist_links()
    print('プレイリスト取得完了')
    print('ライブ情報取得中...')
    sheet_playlist_links = []
    response = requests.get(base_api_url)
    if response.status_code == 200:
        print('ライブ情報取得完了')
        data = response.json()
        if 'lives' in data.keys():
            for live in data['lives']:
                sheet_playlist_links.append(live['url'])
    else:
        print(f"ライブ情報の取得に失敗しました: {response.status_code}")
        return None

    results = []
    for playlist in playlist_links:
        found = False
        for link in sheet_playlist_links:
            if link == playlist['url']:
                found = True
                break
        if not found:
            results.append(playlist)
    return results

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)