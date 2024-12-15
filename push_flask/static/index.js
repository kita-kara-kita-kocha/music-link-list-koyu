window.onload = function() {
    // 利用するHTML要素を定義
    var title_and_artist = document.getElementById('title_and_artist');
    var title = document.getElementById('title');
    var artist = document.getElementById('artist');

    // テキストインプットid=title_and_artistの値を取得し、
    // テキストインプットid=titleとid=artistにそれぞれ代入する
    // 代入する値は、テキストインプットid=title_and_artistの値を「 / 」で分割したもの
    // その後、テキストインプットid=title_and_artistの値を空にする
    function splitTitleAndArtist() {
        var title_and_artist_value = title_and_artist.value;
        var title_str = title_and_artist_value.split(' / ')[0];
        var artist_str = title_and_artist_value.split(' / ')[1];
        title.value = title_str;
        artist.value = artist_str;
        title_and_artist.value = '';
    }

    // テキストインプットid=title_and_artistでEnterキーが押された時にsplitTitleAndArtist関数を実行する
    title_and_artist.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // テキストインプットid=title_and_artistの値が* / *の形式でない場合は通知に表示する
            if (title_and_artist.value.indexOf(' / ') === -1) {
                alert('Please enter the title and artist in the format "title / artist"');
                return;
            }
            splitTitleAndArtist();
        }
    });
};