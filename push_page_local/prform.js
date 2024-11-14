// Type: JavaScript
// Description: フォーム送信を処理するスクリプト

// UTF-8をBase64にエンコードする関数
function utf8ToBase64(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    const base64String = btoa(String.fromCharCode(...utf8Bytes));
    return base64String;
}

// Base64をUTF-8にデコードする関数
function base64ToUtf8(base64String) {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const utf8String = new TextDecoder().decode(bytes);
    return utf8String;
}

// 更新されたリストをhttps://github.com/kita-kara-kita-kocha/music-link-list-koyu/blob/add/music-list-pr/docs/src_list.jsonにpushする関数
// 引数: 更新されたリスト, トークン
function pushUpdatedList(updatedList, token, sha, push_message) {
    // updatedListをBase64エンコード
    const base64Content = utf8ToBase64(JSON.stringify(updatedList, null, 2));
    // 更新されたリストをpush
    return fetch('https://api.github.com/repos/kita-kara-kita-kocha/music-link-list-koyu/contents/docs/src_list.json', {
        method: 'PUT',
        headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
            message: push_message,
            content: base64Content,
            sha: sha,
            branch: 'add/music-list-pr'
        })
    });
}


// フォーム送信を処理する関数
function handleFormSubmission(event) {

    // デフォルトのフォーム送信をキャンセル
    event.preventDefault();

    // フォームの値を取得
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const url = document.getElementById('url').value;
    let date = document.getElementById('date').value;
    const token = document.getElementById('token').value;

    // いずれかのフィールドが空の場合は、エラーメッセージを表示して処理を終了
    if (!title || !artist || !url || !date || !token) {
        alert('空のフィールドがあります。全てのフィールドを入力してください。');
        return;
    }
    
    // dateのフォーマットが正しいかチェック
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date.match(dateRegex)) {
        // dateのフォーマットがYYYY/DD/MMの形式の場合は、YYYY-MM-DDの形式に変換
        if (date.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            date = date.replace(/\//g, '-');
        } else {
            alert('dateのフォーマットが不正です。 YYYY-MM-DDの形式で入力してください。');
            return;
        }
    }

    // ./src_list.jsonから既存のデータを読み取る（music-list-prブランチ）
    fetch('https://api.github.com/repos/kita-kara-kita-kocha/music-link-list-koyu/contents/docs/src_list.json?ref=add/music-list-pr', {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
        .then(response => response.json())
        // src_list.jsonのデータ構造は以下の通り
        // [
        //     {
        //         "title": str,
        //         "artist": str,
        //         "url_date_sets": [
        //             {
        //                 "url": str,
        //                 "date": date
        //             }
        //         ]
        //     }
        // ]
        // 既存リストにtitle, artistの一致があった場合は、そのエントリのurl_date_setsに新しいsetsを追加{url: str, date: str}
        // 一致するエントリがない場合は、新しいエントリをリストに追加{title: str, artist: str, url_date_sets: [{url: str, date: str}]}
        .then(data => {
            const datajson = JSON.parse(base64ToUtf8(data.content));
            let updatedList = datajson;
            let isMatched = false;
            let date_sets = [];
            updatedList.forEach(entry => {
                if (entry.title === title && entry.artist === artist) {
                    isMatched = true;
                    date_sets = entry.url_date_sets;
                }
            });
            let push_message = `Add new entry: ${title}/${artist}`;
            // 一致するエントリがない場合
            if (!isMatched) {
                // 新しいエントリをリストに追加
                updatedList.push({
                    title: title,
                    artist: artist,
                    url_date_sets: [{url: url, date: date}]
                });
                // 通知
                console.log('New entry added');
            // 一致するエントリがある場合
            } else {
                // 一致するdateがある場合は、該当のエントリの日付とURLのセットのURLを更新
                if (date_sets.some(set => set.date === date)) {
                    updatedList = updatedList.map(entry => {
                        if (entry.title === title && entry.artist === artist) {
                            entry.url_date_sets = entry.url_date_sets.map(set => {
                                if (set.date === date) {
                                    // 既存のURLを新しいURLに更新
                                    push_message = `Update URL: ${title}/${artist}`;
                                    set.url = url;
                                }
                                return set;
                            });
                        }
                        // 通知
                        console.log('URL updated');
                        return entry;
                    });
                // 一致するdateがない場合は、該当のエントリの新しい日付とURLのセットを追加
                } else {
                    updatedList = updatedList.map(entry => {
                        if (entry.title === title && entry.artist === artist) {
                            push_message = `Add new date: ${title}/${artist}`;
                            entry.url_date_sets.push({url: url, date: date});
                        }
                        // 通知
                        console.log('New date added');
                        return entry;
                    });
                }
            }
            return pushUpdatedList(updatedList, token, data.sha, push_message);
        })
        // 更新が成功した場合は、成功メッセージを表示
        .then(response => {
            if (response.ok) {
                alert('フォームが正常に送信されました。');
                document.getElementById('musicForm').reset();
            } else {
                alert('フォームの送信に失敗しました。');
            }
        })
        // エラーが発生した場合は、エラーメッセージを表示
        .catch(error => {
            console.error(error);
            alert('既存dデータの取得に失敗しました。（たぶん。）');
        });
}

// フォームにイベントリスナーを追加
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('musicForm').addEventListener('submit', handleFormSubmission);
});