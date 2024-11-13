// Path: docs/src_list.json

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
                const li = document.createElement('li');
                li.setAttribute('ontouchstart', '');
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

    // ソートボタンdev.sort_titleをクリックしたときにソートする
    document.getElementById('sort_title').addEventListener('click', sortListTitle);
    // ソートボタンdev.sort_artistをクリックしたときにソートする
    document.getElementById('sort_artist').addEventListener('click', sortListArtist);
    // ソートボタンdev.sort_dateをクリックしたときにソートする
    document.getElementById('sort_date').addEventListener('click', sortListDate);
    // ソートボタンdev.sort_new_dateをクリックしたときにソートする
    document.getElementById('sort_new_date').addEventListener('click', sortListNewDate);
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
        const dateA = a.querySelector('a').textContent;
        const dateB = b.querySelector('a').textContent;
        if (sortIf == 0) {
            return listSort(dateA, dateB);
        }
        else {
            return listSort(dateB, dateA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

// ul.music-listのリストの最新日付リンク(liタグ内の最後のaタグ)でソートする関数
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
        const dateA = a.querySelector('a:last-child').textContent;
        const dateB = b.querySelector('a:last-child').textContent;
        if (sortIf == 0) {
            return listSort(dateA, dateB);
        }
        else {
            return listSort(dateB, dateA);
        }
    });
    items.forEach(item => musicList.appendChild(item));
}

