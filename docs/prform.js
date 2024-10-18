// Type: JavaScript
// Description: フォーム送信を処理するスクリプト

// youtubeリンクから動画の投稿日を取得する関数
function getVideoPublishedAt(url) {
    const videoId = url.split('v=')[1];
    if (!videoId) {
        console.error('Invalid YouTube URL:', url);
        return Promise.resolve('Invalid URL');
    }

    return fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`)
        .then(response => response.json())
        .then(data => {
            if (!data.items || !data.items.length) {
                console.error('No items found in the response:', data);
                return 'No items found';
            }
            // 日付はyyyy-mm-ddの形式で返される
            return data.items[0].snippet.publishedAt.split('T')[0];
        })
        .catch(error => {
            console.error('Error fetching the video data:', error);
            return 'Error fetching the video data';
        });
}

// フォーム送信を処理する関数
function handleFormSubmission(event) {
    event.preventDefault();

    // フォームの値を取得
    const title = document.getElementById('title').value;
    const artist = document.getElementById('artist').value;
    const url = document.getElementById('url').value;

    // 新しいエントリを作成
    const newEntry = {
        title: title,
        artist: artist,
        url: url
    };

    // ./src_list.jsonから既存のデータを読み取る
    // 既存リストにtitle, artistの一致があった場合は、そのエントリのurl_date_setsに新しいURLを追加
    // 一致するエントリがない場合は、新しいエントリをリストに追加
    // {title: str, artist: str, url_date_sets: [{url: str, date: str}]}の形式で追加
    // 追加後、リストを./src_list.jsonに書き込む
    fetch('./src_list.json')
        .then(response => response.json())
        .then(data => {
            let found = false;
            data.forEach(item => {
                if (item.title === title && item.artist === artist) {
                    if (!item.url_date_sets) {
                        item.url_date_sets = [];
                    }
                    item.url_date_sets.push({url: url, date: 'Loading...'});
                    found = true;
                }
            });
            if (!found) {
                data.push({
                    title: title,
                    artist: artist,
                    url_date_sets: [{url: url, date: 'Loading...'}]
                });
            }
            return data;
        })
        .then(data => {
            return fetch('./src_list.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error writing the JSON:', response);
            }
            return response.json();
        })
        .then(data => {
            // リストの更新が成功したら、動画の投稿日を取得してリストを更新
            const newEntryIndex = data.findIndex(item => item.title === title && item.artist === artist);
            getVideoPublishedAt(url).then(date => {
                data[newEntryIndex].url_date_sets[data[newEntryIndex].url_date_sets.length - 1].date = date;
                return data;
            });
            return data;
        })
        .then(data => {
            return fetch('./src_list.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error writing the JSON:', response);
            }
            return response.json();
        })
        .then(data => {
            // リストの更新が成功したら、リストを再描画
            const musicList = document.querySelector('ul.music-list');
            if (!musicList) {
                console.error('ul.music-list element not found');
                return;
            }
            musicList.innerHTML = '';
            data.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `${item.title}/${item.artist}`;
                if (item.url_date_sets) {
                    item.url_date_sets.forEach(set => {
                        const a = document.createElement('a');
                        a.href = set.url;
                        a.textContent = set.date;
                        li.appendChild(a);
                    });
                }
                musicList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching the JSON:', error));
}

// フォームにイベントリスナーを追加
document.getElementById('musicForm').addEventListener('submit', handleFormSubmission);