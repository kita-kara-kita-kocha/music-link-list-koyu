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
function pushUpdatedList(updatedList, token, sha) {
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
            message: 'Add a new entry',
            content: base64Content,
            sha: sha,
            branch: 'add/music-list-pr'
        })
    });
}


// フォーム送信を処理する関数
function handleFormSubmission(event) {
    event.preventDefault();

    // フォームの値を取得
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const url = document.getElementById('url').value;
    const date = document.getElementById('date').value;
    const token = document.getElementById('token').value;

    // 新しいエントリを作成
    const newEntry = {
        title: title,
        artist: artist,
        url: url
    };

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
            updatedList.forEach(entry => {
                if (entry.title === title && entry.artist === artist) {
                    isMatched = true;
                }
            });
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
                // 一致するdateがある場合は、urlを更新
                if (entry.url_date_sets.some(set => set.date === date)) {
                    updatedList = updatedList.map(entry => {
                        entry.url_date_sets = entry.url_date_sets.map(set => {
                            set.url = url;
                            return set;
                        });
                        // 通知
                        console.log('updated url');
                        return entry;
                    });
                } else {
                    // 既存のエントリに新しいsetsを追加
                    updatedList = updatedList.map(entry => {
                        // dateが一致するエントリがある場合は、urlを更新
                        if (entry.title === title && entry.artist === artist) {
                            entry.url_date_sets.push({url: url, date: date});
                        }
                        // 通知
                        console.log('updated entry');
                        return entry;
                    });
                }
            }
            return pushUpdatedList(updatedList, token, data.sha);
        })
        // 更新が成功した場合は、成功メッセージを表示
        .then(response => {
            if (response.ok) {
                alert('Successfully submitted the form!');
                document.getElementById('musicForm').reset();
            } else {
                alert('Failed to submit the form.');
            }
        })
        // エラーが発生した場合は、エラーメッセージを表示
        .catch(error => {
            console.error(error);
            alert('Failed to submit the form.');
        });
}

// フォームにイベントリスナーを追加
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('musicForm').addEventListener('submit', handleFormSubmission);
});