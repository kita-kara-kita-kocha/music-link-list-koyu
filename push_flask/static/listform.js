var el_url
var el_title
var el_date
var el_thumbnail
var el_time_table_textarea
var el_live_table
var el_music_table
var el_link_check_button
var el_set_commits_info_button
var el_update_commits_info_button
var el_push_to_sheet_button
var el_clear_commits_info_button
const api_id = 'AKfycbw7t2ua6BG7l7XNbNPVD1zbCZodZTCMTx-FzMPu7JS6ice4sY435BL8ync4lPnX_hU'
const api_url = 'https://script.google.com/macros/s/' + api_id + '/exec'

window.onload = function() {
    // 利用するHTML要素を定義
    el_url = document.getElementById('url');
    el_title = document.getElementById('title');
    el_date = document.getElementById('date');
    el_thumbnail = document.getElementById('thumbnail');
    el_time_table_textarea = document.getElementById('time_table_textarea');
    el_live_table = document.getElementById('live_table');
    el_music_table = document.getElementById('music_table');
    el_link_check_button = document.getElementById('link_check');
    el_set_commits_info_button = document.getElementById('set_commits_info');
    el_update_commits_info_button = document.getElementById('update_commits_info');
    el_push_to_sheet_button = document.getElementById('push_to_sheet');
    el_clear_commits_info_button = document.getElementById('clear_commits_info');

    // link_checkボタンがクリックされたらlink_checkを実行
    el_link_check_button.onclick = link_check;

    // set_commits_infoボタンがクリックされたらset_commits_infoを実行
    el_set_commits_info_button.onclick = set_commits_info;

    // update_commits_infoボタンがクリックされたらupdate_commits_infoを実行
    el_update_commits_info_button.onclick = update_commits_info;

    // push_to_sheetボタンがクリックされたらpush_to_sheetを実行
    el_push_to_sheet_button.onclick = push_to_sheet;

    // clear_commits_infoボタンがクリックされたらclear_commits_infoを実行
    el_clear_commits_info_button.onclick = clear_commits_info;

    // input type="url" id="url" の値が変更されたら、getUploadDateを実行
    el_url.onchange = getUploadDate;
}

function link_check() {
    // link_checkでGETリクエストパラメーターにapi_urlをいれて送信
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/link_check?api_url=' + encodeURIComponent(api_url), true);
    xhr.send();
    // レスポンスを取得
    xhr.onload = function() {
        var response = xhr.responseText;
        // responseをデコード
        response_json = JSON.parse(response);
        // response_jsonの配列をtable id="uncommit_link"に表示
        var el_uncommit_link_table = document.getElementById('uncommit_link');
        // 既存の行を削除
        while (el_uncommit_link_table.rows.length > 1) {
            el_uncommit_link_table.deleteRow(1);
        }
        // データが存在し、配列であることを確認
        if (response_json && Array.isArray(response_json)) {
            // 新しい行を追加
            for (var i = 0; i < response_json.length; i++) {
                var row = el_uncommit_link_table.insertRow(-1);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                cell1.innerHTML = response_json[i].title;
                cell2.innerHTML = '<a href="' + response_json[i].url + '" target="_blank">' + response_json[i].url + '</a>';
                cell3.innerHTML = response_json[i].upload_date;
            }
            // uncommit_link_tableのhidden属性を削除
            el_uncommit_link_table.removeAttribute('hidden');
        } else {
            el_uncommit_link_table.setAttribute('hidden', true);
        }
    }
}

function set_commits_info() {
    // urlテキストボックスの文字列を取得
    var url_value = el_url.value;
    // titleテキストボックスの文字列を取得
    var title_value = el_title.value;
    // dateテキストボックスの文字列を取得
    var date_value = el_date.value;
    // thumbnailテキストボックスの文字列を取得
    var thumbnail_value = el_thumbnail.value;
    // dateの文字列形式がYYYY-MM-DDか確認
    if (!date_value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY/MM/DDの形式ならば、YYYY-MM-DDに変換
        if (date_value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            date_value = date_value.replace(/\//g, '-');
        } else {
            alert('日付の形式が正しくありません');
            return;
        }
    }
    // テキストエリアの文字列を取得
    var time_table_textarea_value = el_time_table_textarea.value;
    // テキストエリアの文字列を改行で分割
    var time_table_lines = time_table_textarea_value.split('\n');
    // live_tableの既存の行を削除
    while (el_live_table.rows.length > 1) {
        el_live_table.deleteRow(1);
    }
    // url, title, dateをlive_tableに追加
    el_live_table.innerHTML += '<tr><td>' + title_value + '</td><td>' + url_value + '</td><td>' + date_value + '</td><td>' + thumbnail_value + '</td></tr>';
    // live_tableのhidden属性を削除
    el_live_table.removeAttribute('hidden');

    // music_tableの既存の行を削除
    while (el_music_table.rows.length > 1) {
        el_music_table.deleteRow(1);
    }
    // music_tableの各行を処理
    for (var i = 0; i < time_table_lines.length; i++) {
        // 各行が{time(.*:d{1,2})} {title} / {artist}の形式か確認
        if (!time_table_lines[i].match(/.*:\d{1,2} .+ \/ .+$/)) {
            alert('テキストエリアの形式が正しくありません');
            return;
        }
        // 各行から時間と曲名、アーティスト名を取得
        var time_str = time_table_lines[i].split(' ')[0];
        // time_table_lines[i]からtime_strの文字数分を除去する
        var title_artist = time_table_lines[i].substring(time_str.length + 1);
        var title  = title_artist.split(' / ')[0];
        var artist = title_artist.split(' / ')[1];
        // time_strを時間と分と秒に分割
        var time_str_split = time_str.split(':');
        // time_seccondを定義
        var time_second = 0;
        // time_str_splitの要素を確認し、2つなら分と秒を、3つなら時間と分と秒を、すべて秒に変換して格納
        if (time_str_split.length == 2) {
            time_second = parseInt(time_str_split[0]) * 60 + parseInt(time_str_split[1]);
        }
        if (time_str_split.length == 3) {
            time_second = parseInt(time_str_split[0]) * 3600 + parseInt(time_str_split[1]) * 60 + parseInt(time_str_split[2]);
        }
        // 曲名、アーティスト名、Timestampをmusic_tableに追加
        el_music_table.innerHTML += '<tr><td>' + title + '</td><td>' + artist + '</td><td>' + time_second + '</td><td></td><td></td></tr>';
    }
    // music_tableのhidden属性を削除
    el_music_table.removeAttribute('hidden');
    // update_commits_info_buttonのhidden属性を削除
    el_update_commits_info_button.removeAttribute('hidden');
    // push_to_sheet_buttonのhidden属性を削除
    el_push_to_sheet_button.removeAttribute('hidden');
    // テキストボックスとテキストエリアをクリア
    el_url.value = '';
    el_title.value = '';
    el_date.value = '';
    el_time_table_textarea.value = '';
    el_thumbnail.value = '';
}

// music_tableをレコードごとに、コミットするためのリクエストにする関数
function update_commits_info() {
    // live_tableのレコードを取得
    var live_table_rows = el_live_table.rows;
    // live_tableのレコードから各要素を取得(title, date, url)
    var title = live_table_rows[1].cells[0].innerHTML;
    var url = live_table_rows[1].cells[1].innerHTML;
    var date = live_table_rows[1].cells[2].innerHTML;
    // music_tableのレコードを取得
    var music_table_rows = el_music_table.rows;
    // music_tableのレコードを処理
    addData = []
    for (var i = 1; i < music_table_rows.length; i++) {
        // music_tableのレコードから各要素を取得
        var title = music_table_rows[i].cells[0].innerHTML;
        var artist = music_table_rows[i].cells[1].innerHTML;
        var time_second = music_table_rows[i].cells[2].innerHTML;
        // URLを確認・編集
        // ※ ?t=.*sか&t=.*sが最後にあれば、それを削除
        // ※ URLに?が含まれていなければ、?t=0sを追加
        // ※ URLに?が含まれていれば、&t=0sを追加
        console.log(url);
        if (url.match(/\?t=\d+s$/)) {
            url = url.replace(/\?t=\d+s$/, '');
        } else if (url.match(/&t=\d+s$/)) {
            url = url.replace(/&t=\d+s$/, '');
        }
        console.log(url);
        if (url.match(/.+\?.+$/)) {
            url += '&t=' + time_second + 's';
        } else {
            url += '?t=' + time_second + 's';
        }
        console.log(url);

        // recordオブジェクトを作成
        const record = {
            'title': title,
            'artist': artist,
            'date': date,
            'url': url
        };
        addData.push(record);
        // 「/registerRecord」にPOSTリクエストを送信
        // ※ 順番でrequestしたいので、同期通信で処理する
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/registerRecord', false);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.send(JSON.stringify(record));
        // レスポンスを取得
        var response = xhr.responseText;
        // response["result"]をデコード
        response = JSON.parse(response)["result"];
        // レスポンスをmusic_tableに表示
        music_table_rows[i].cells[3].innerHTML = response;
    }
    
}

function push_to_sheet() {
    // live_tableのレコードを取得
    var live_table_rows = el_live_table.rows;
    // music_tableのレコードを取得
    var music_table_rows = el_music_table.rows;
    // live_tableのレコード(1行)から各要素を取得(title, date, url)
    var live_title = live_table_rows[1].cells[0].innerHTML;
    var live_url = live_table_rows[1].cells[1].innerHTML;
    var live_date = live_table_rows[1].cells[2].innerHTML;
    var live_thumbnail = live_table_rows[1].cells[3].innerHTML;
    // music_tableのレコードから各要素を取得(title, artist, timestamp)
    let timestamps = [];
    for (var i = 1; i < music_table_rows.length; i++) {
        var music_title = music_table_rows[i].cells[0].innerHTML;
        var music_artist = music_table_rows[i].cells[1].innerHTML;
        var music_timestamp = music_table_rows[i].cells[2].innerHTML;
        timestamps.push({
            'title': music_title,
            'artist': music_artist,
            'timestamp': music_timestamp
        });
    }
    // FlaskサーバーのエンドポイントにPOSTリクエストを送信
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/push_to_sheet', true);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.send(JSON.stringify({
        'api_url': api_url,
        'live_url': live_url,
        'title': live_title,
        'date': live_date,
        'thumbnail': live_thumbnail,
        'timestamps': timestamps
    }));
    // レスポンスを取得
    xhr.onload = function() {
        var response = xhr.responseText;
        // responseをデコード
        response = JSON.parse(response);
        // ["error"]があればアラート表示
        if (response["error"]) {
            alert(response["error"]);
            return;
        }
        // response["result"]をmusic_tableのaddSheetResultに表示
        for (var i = 1; i < music_table_rows.length; i++) {
            // response["result"]の形式は{ success: true, id: addRow, title: timestamp.title, artist: timestamp.artist }
            music_table_rows[i].cells[4].innerHTML = response["results"][i-1].success ? '成功' : '失敗';
        }
    }
}

function clear_commits_info() {
    // music_tableのレコードを削除
    // ※ ヘッダー行は残す
    while (el_music_table.rows.length > 1) {
        el_music_table.deleteRow(1);
    }
    // music_tableのhidden属性を追加
    el_music_table.setAttribute('hidden', true);
    // update_commits_info_buttonのhidden属性を追加
    el_update_commits_info_button.setAttribute('hidden', true);
}

// URLの有効性をチェックし、日付を取得する関数
function getUploadDate() {
    // https://www.youtube.com/watch?v={11文字} の形式か確認
    if (el_url.value.match(/https:\/\/www.youtube.com\/watch\?v=.+/)) {
        // 正しい形式なら、/getUploadDateにPOSTリクエストを送信
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/getUploadDate', false);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.send(JSON.stringify({
            'url': el_url.value
        }));
        // レスポンスを取得
        var response = xhr.responseText;
        // responseをデコード
        response = JSON.parse(response);
        // title, upload_date, thumbnailを取得
        var video_title = response.data.title;
        var upload_date = response.data.upload_date;
        var thumbnail = response.data.thumbnail;
        // titleテキストボックスにレスポンスを表示
        el_title.value = video_title;
        // dateテキストボックスにレスポンスを表示
        el_date.value = upload_date;
        // thumbnailテキストボックスにレスポンスを表示
        el_thumbnail.value = thumbnail;
    }
}