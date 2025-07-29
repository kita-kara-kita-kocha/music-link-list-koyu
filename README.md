# music-link-list-koyu
星降こゆの歌った楽曲リストとリンク
[ページリンク](https://kita-kara-kita-kocha.github.io/music-link-list-koyu/)

やること
- [x] html+cssでページ作成
- [x] Pagesで公開
- [x] htmlにjs追加してフォーム作成
- [x] 追加情報の投稿をPRへ流す機能を付ける(js)
- [x] 最新の配信（歌枠）までの情報を入力

``` sh
source push_flask/flask/bin/activate
export FLASK_APP=push_flask
export FLASK_ENV=development
flask run
```

``` sh
source push_flask/flask/bin/activate
python link_chk.py
```
