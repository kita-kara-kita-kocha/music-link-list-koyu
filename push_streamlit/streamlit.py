import streamlit as st
import json

# 前提情報を定義
set_date = ''
set_artist = ''

st.title('タイムテーブル入力フォーム')

st.write('''
フォーム「Title:」「Artist:」「URL:」「DATE:」を入力。コミットして、ソースのjsonファイルを編集する。
''')

# jsonファイルのパス
json_path = '../docs/src_list.json'

# jsonファイルを読み込む関数
def read_json():
    with open(json_path, 'r') as f:
        src_list = json.load(f)
    return src_list

# jsonファイルを、引数のjsonファイルに書き換える関数
def write_json(json_file):
    # そのままだと代替え文字が入るので、ensure_ascii=Falseを指定
    with open(json_path, 'w') as f:
        json.dump(json_file, f, ensure_ascii=False, indent=4)

# titleとartistが一致するものがないか確認
def check_json_music(src_list, title, artist):
    '''
    処理:titleとartistが一致するものがないか確認
    引数:title, artist
    戻り値:一致するものがあればそのindexを返す。なければ0を返す
    '''
    for i in range(len(src_list)):
        # 大文字小文字を無視して比較
        # スペースを無視して比較
        if src_list[i]['title'].replace(' ', '').lower() == title.replace(' ', '').lower() and src_list[i]['artist'].replace(' ', '').lower() == artist.replace(' ', '').lower():
            return i
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
    subprocess.run(['git', 'add', '../docs/src_list.json'])
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
            msg = f'{title} / {artist} : 既存楽曲の既存日付のURLを更新しました\n{src_list[i]['url_date_sets'][j]['url']}\n→{url}'
            src_list[i]['url_date_sets'][j]['url'] = url
    else:
        # なかった場合は新規追加
        url_date_set = {'url': url, 'date': date}
        src_list.append({'title': title, 'artist': artist, 'url_date_sets': [url_date_set]})
        msg = f'{title} / {artist} : 新しい楽曲を追加しました'
    # jsonファイルを書き換える
    write_json(src_list)
    st.write(msg)
    # git commit
    git_commit(msg)
    return

with st.form(key='my_form', clear_on_submit=True):
    title = st.text_input('Title:')
    artist = st.text_input('Artist:', value=set_artist)
    url = st.text_input('URL:')
    date = st.text_input('DATE:', value=set_date)
    submitted = st.form_submit_button(label='更新')
    set_date = date

    if submitted:
        commit_json(title, artist, url, date)
