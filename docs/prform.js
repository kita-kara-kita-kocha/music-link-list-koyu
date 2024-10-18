// Type: JavaScript
// Description: フォーム送信を処理するスクリプト

// UTF-8をBase64にエンコードする関数
function utf8ToBase64(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    const base64String = btoa(String.fromCharCode(...utf8Bytes));
    return base64String;
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

    // ./src_list.jsonから既存のデータを読み取る
    fetch('./src_list.json')
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
        .then(response => response.json())
        // 既存リストにtitle, artistの一致があった場合は、そのエントリのurl_date_setsに新しいsetsを追加{url: str, date: str}
        // 一致するエントリがない場合は、新しいエントリをリストに追加{title: str, artist: str, url_date_sets: [{url: str, date: str}]}
        .then(data => {
            let updatedList = data;
            let isMatched = false;
            updatedList.forEach(entry => {
                if (entry.title === title && entry.artist === artist) {
                    isMatched = true;
                    entry.url_date_sets.push({url: url, date: date});
                }
            });
            if (!isMatched) {
                updatedList.push({
                    title: title,
                    artist: artist,
                    url_date_sets: [{url: url, date: date}]
                });
            }
            return updatedList;
        })
        // 現在のSHAを取得
        .then(updatedList => {
            return fetch('https://api.github.com/repos/kita-kara-kita-kocha/music-link-list-koyu/contents/docs/src_list.json?ref=add/music-list-pr', {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
                .then(response => response.json())
                .then(data => {
                    return data.sha;
                })
                // 更新されたリストをhttps://github.com/kita-kara-kita-kocha/music-link-list-koyu/blob/add/music-list-pr/docs/src_list.jsonにpush
                .then(sha => {
                    // updatedListをBase64エンコード
                    const base64Content = utf8ToBase64(JSON.stringify(updatedList, null, 2));
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
                });
        })
        // 更新が成功した場合は、成功メッセージを表示
        .then(response => {
            if (response.ok) {
                alert('Successfully submitted the form!');
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