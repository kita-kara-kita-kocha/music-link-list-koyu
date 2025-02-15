import re
import subprocess
from push_flask import app
from flask import render_template, request, redirect, url_for, make_response
import json
import html

@app.route('/')
def index():
    return render_template('index.html')

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
        result = get_video_info(video_url=url)
        res = make_response({'result': result})
        res.headers['Content-Type'] = 'application/json'
        return res
    except:
        res = make_response({'result': 'error'})
        res.headers['Content-Type'] = 'application/json'
        return res

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