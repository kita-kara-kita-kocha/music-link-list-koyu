var url
var date
var time_table_textarea
var music_table
var update_commits_info_button

window.onload = function() {
    // 利用するHTML要素を定義
    url = document.getElementById('url');
    date = document.getElementById('date');
    time_table_textarea = document.getElementById('time_table_textarea');
    music_table = document.getElementById('music_table');
    update_commits_info_button = document.getElementById('update_commits_info');

    // set_commits_infoボタンがクリックされたらset_commits_infoを実行
    document.getElementById('set_commits_info').onclick = set_commits_info;

    // update_commits_infoボタンがクリックされたらupdate_commits_infoを実行
    document.getElementById('update_commits_info').onclick = update_commits_info;

    // clear_commits_infoボタンがクリックされたらclear_commits_infoを実行
    document.getElementById('clear_commits_info').onclick = clear_commits_info;
}

function set_commits_info() {
    // urlテキストボックスの文字列を取得
    var url_value = url.value;
    // dateテキストボックスの文字列を取得
    var date_value = date.value
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
    var time_table_textarea_value = time_table_textarea.value;
    // テキストエリアの文字列を改行で分割
    var time_table_lines = time_table_textarea_value.split('\n');
    // 各行を処理
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
        // URLを確認・編集
        // ※ ?t=.*sか&t=.*sが最後にあれば、それを削除
        // ※ URLに?が含まれていなければ、?t=0sを追加
        // ※ URLに?が含まれていれば、&t=0sを追加
        if (url_value.match(/\?t=\d+s$/)) {
            url_value = url_value.replace(/\?t=\d+s$/, '');
        } else if (url_value.match(/&t=\d+s$/)) {
            url_value = url_value.replace(/&t=\d+s$/, '');
        }
        if (url_value.match(/.+\?.+$/)) {
            url_value += '&t=' + time_second + 's';
        } else {
            url_value += '?t=' + time_second + 's';
        }
        // 曲名、アーティスト名、日付、URLをmusic_tableに追加
        music_table.innerHTML += '<tr><td>' + title + '</td><td>' + artist + '</td><td>' + date_value + '</td><td>' + url_value + '</td></tr>';
        // music_tableのhidden属性を削除
        music_table.removeAttribute('hidden');
    }
    update_commits_info_button.removeAttribute('hidden');
}

// music_tableをレコードごとにコミットする関数
function update_commits_info() {
    // music_tableのレコードを取得
    var music_table_rows = music_table.rows;
    // music_tableのレコードを処理
    for (var i = 1; i < music_table_rows.length; i++) {
        // music_tableのレコードから各要素を取得
        var title = music_table_rows[i].cells[0].innerHTML;
        var artist = music_table_rows[i].cells[1].innerHTML;
        var date = music_table_rows[i].cells[2].innerHTML;
        var url = music_table_rows[i].cells[3].innerHTML;
        // 「/registerRecord」にPOSTリクエストを送信
        fetch('/registerRecord', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                artist: artist,
                date: date,
                url: url
            })
        }).then(function(response) {
            // レスポンスを確認
            if (response['result'] == 'success') {
                console.log('Record is registered');
            } else {
                console.log(response);
            }
        });
    }
    update_commits_info_button.setAttribute('hidden', true);
}

function clear_commits_info() {
    // music_tableのレコードを削除
    // ※ ヘッダー行は残す
    while (music_table.rows.length > 1) {
        music_table.deleteRow(1);
    }
    // music_tableのhidden属性を追加
    music_table.setAttribute('hidden', true);
    // update_commits_info_buttonのhidden属性を追加
    update_commits_info_button.setAttribute('hidden', true);
}