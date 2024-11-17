// Path: docs/src_list.json

function toggle(name) {
    document.querySelector('.' + name).classList.toggle('open');
}


document.addEventListener('DOMContentLoaded', function() {
    fetch('./src_list.json')
        .then(response => response.json())
        .then(data => {
            const musicList = document.querySelector('ul.music-list');
            if (!musicList) {
                console.error('ul.music-list element not found');
                return;
            }
            data.forEach(item => {
                const musicList_li = document.createElement('li');
                musicList_li.setAttribute('ontouchstart', '');
                const dev_music_record = document.createElement('dev');
                dev_music_record.className = 'music_record';
                dev_music_record.textContent = `${item.title} / ${item.artist}`;
                ul_url_date_sets = document.createElement('ul');
                if (item.url_date_sets) {
                    item.url_date_sets.forEach(set => {
                        const a = document.createElement('a');
                        a.href = set.url;
                        a.textContent = set.date;
                        ul_url_date_sets = document.createElement('ul');
                        li_url_date_set = document.createElement('li');
                        li_url_date_set.appendChild(a);
                        // iframeを追加するボタンを追加
                        const button = document.createElement('button');
                        // iframeの追加先はdev id=streaming
                        // iframeの追加先のにiframeがある場合は削除してから追加
                        // set.urlがhttps://www.youtube.com/watch?v=${videoId}&t=${start}sの形式でなかったら追加せず、×ボタンアイコンを追加
                        // set.urlからvideoIdとstartを取得し、src="https://www.youtube.com/embed/${videoId}?start=${start}"を設定
                        // iframeにはallow="accelerometer; autoplay; mute; clipboard-write; encrypted-media; gyroscope; picture-in-picture"を設定
                        // iframeの高さは216、幅は384に設定
                        // iframeの追加ボタンをクリックしたときにiframeを追加or置き換えする
                        if (set.url.match(/https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+&t=[0-9]+s/)) {
                            button.textContent = '▶';
                            button.addEventListener('click', function() {
                                const iframe = document.createElement('iframe');
                                iframe.id = 'streaming_iframe';
                                // watch?v=をembed/に置換、&t=を?start=に置換、最後の文字がsなら削除、autoplay=1&mute=1を追加、jsからのコントロールの許可を追加
                                const cnv_url = set.url.replace('watch?v=', 'embed/').replace('&t=', '?start=').replace(/s$/, '') + '&autoplay=1';
                                iframe.allow = 'accelerometer; autoplay; mute; clipboard-write; encrypted-media; gyroscope; picture-in-picture; setVolume';
                                iframe.src = cnv_url;
                                iframe.height = 180;
                                iframe.width = 320;
                                // iframeの追加or置き換え
                                if (streaming.firstChild) {
                                    streaming.removeChild(streaming.firstChild);
                                }
                                streaming.appendChild(iframe);
                            });
                            li_url_date_set.appendChild(button);
                        } else {
                            button.textContent = '✕';
                        }
                        ul_url_date_sets.appendChild(li_url_date_set);
                        dev_music_record.appendChild(ul_url_date_sets);
                        musicList_li.appendChild(dev_music_record);
                    });
                }
                musicList.appendChild(musicList_li);
            });
        })
        .catch(error => console.error('Error fetching the JSON:', error));

    // ソートボタンdev.sort_titleをクリックしたときにソートする
    document.getElementById('sort_title').addEventListener('click', sortListTitle);
    // ソートボタンdev.sort_artistをクリックしたときにソートする
    document.getElementById('sort_artist').addEventListener('click', sortListArtist);
    // ソートボタンdev.sort_dateをクリックしたときにソートする
    document.getElementById('sort_date').addEventListener('click', sortListDate);
    // ソートボタンdev.sort_new_dateをクリックしたときにソートする
    document.getElementById('sort_new_date').addEventListener('click', sortListNewDate);

    // ページ読み込み後1分後に<blockquote class="twitter-tweet">を閉じる
    setTimeout(function() {
        document.querySelector('.twitter-tweet').classList.toggle('open');
    }, 60000);

});

// 引数以外のsort_title, sort_artist, sort_date, sort_new_dateの4つのソートボタンの△と▽を消す関数
function sortButtonReset(untarget) {
    if (untarget != 'sort_title') {
        document.getElementById('sort_title').textContent = 'タイトルでソート';
    }
    if (untarget != 'sort_artist') {
        document.getElementById('sort_artist').textContent = 'アーティスト名でソート';
    }
    if (untarget != 'sort_date') {
        document.getElementById('sort_date').textContent = '初回日付でソート';
    }
    if (untarget != 'sort_new_date') {
        document.getElementById('sort_new_date').textContent = '最新日付でソート';
    }
}

// ソートする関数を定義
function listSort(source_a, source_b) {
    if (source_a < source_b) {
        return -1;
    }
    if (source_a > source_b) {
        return 1;
    }
    return 0;
}

// ul.music-listのリストをタイトルでソートする関数
function sortListTitle() {
    sortButtonReset('sort_title');
    sortButtom = document.getElementById('sort_title');
    let sortIf = 0;
    if (sortButtom.textContent == 'タイトルでソート' || sortButtom.textContent == 'タイトルでソート△') {
        sortButtom.textContent = 'タイトルでソート▽';
    }
    else {
        sortButtom.textContent = 'タイトルでソート△';
        sortIf = 1;
    }

    const musicList = document.querySelector('ul.music-list');
    if (!musicList) {
        console.error('ul.music-list element not found');
        return;
    }
    const items = Array.from(musicList.children);
    items.sort((a, b) => {
        const titleA = a.textContent.toLowerCase();
        const titleB = b.textContent.toLowerCase();
        if (sortIf == 0) {
            return listSort(titleA, titleB);
        }
        else {
            return listSort(titleB, titleA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

// ul.music-listのリストをアーティスト名でソートする関数(/で分割して2番目を比較)
function sortListArtist() {
    sortButtonReset('sort_artist');
    sortButtom = document.getElementById('sort_artist');
    let sortIf = 0;
    if (sortButtom.textContent == 'アーティスト名でソート' || sortButtom.textContent == 'アーティスト名でソート△') {
        sortButtom.textContent = 'アーティスト名でソート▽';
    }
    else {
        sortButtom.textContent = 'アーティスト名でソート△';
        sortIf = 1;
    }
    const musicList = document.querySelector('ul.music-list');
    if (!musicList) {
        console.error('ul.music-list element not found');
        return;
    }
    const items = Array.from(musicList.children);
    items.sort((a, b) => {
        const artistA = a.textContent.toLowerCase().split('/')[1];
        const artistB = b.textContent.toLowerCase().split('/')[1];
        if (sortIf == 0) {
            return listSort(artistA, artistB);
        }
        else {
            return listSort(artistB, artistA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

// ul.music-listのリストの初回日付リンク(liタグ内の最初のaタグ)でソートする関数
function sortListDate() {
    sortButtonReset('sort_date');
    sortButtom = document.getElementById('sort_date');
    sortIf = 0;
    if (sortButtom.textContent == '初回日付でソート' || sortButtom.textContent == '初回日付でソート△') {
        sortButtom.textContent = '初回日付でソート▽';
    }
    else {
        sortButtom.textContent = '初回日付でソート△';
        sortIf = 1;
    }
    const musicList = document.querySelector('ul.music-list');
    if (!musicList) {
        console.error('ul.music-list element not found');
        return;
    }
    const items = Array.from(musicList.children);
    items.sort((a, b) => {
        const dateA = a.querySelector('dev:first-child a').textContent;
        const dateB = b.querySelector('dev:first-child a').textContent;
        if (sortIf == 0) {
            return listSort(dateA, dateB);
        }
        else {
            return listSort(dateB, dateA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

// ul.music-listのリストの最新日付リンク(liタグ内の最後のdevタグ内aタグ)でソートする関数
function sortListNewDate() {
    sortButtonReset('sort_new_date');
    sortButtom = document.getElementById('sort_new_date');
    sortIf = 0;
    if (sortButtom.textContent == '最新日付でソート' || sortButtom.textContent == '最新日付でソート△') {
        sortButtom.textContent = '最新日付でソート▽';
    }
    else {
        sortButtom.textContent = '最新日付でソート△';
        sortIf = 1;
    }
    const musicList = document.querySelector('ul.music-list');
    if (!musicList) {
        console.error('ul.music-list element not found');
        return;
    }
    const items = Array.from(musicList.children);
    items.sort((a, b) => {
        const dateA = a.querySelector('dev:last-child a').textContent;
        const dateB = b.querySelector('dev:last-child a').textContent;
        if (sortIf == 0) {
            return listSort(dateA, dateB);
        }
        else {
            return listSort(dateB, dateA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

