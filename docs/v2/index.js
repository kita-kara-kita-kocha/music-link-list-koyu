const { useState, useEffect } = React;

// APIから楽曲・ライブデータを取得
const API_ID = 'AKfycbw7t2ua6BG7l7XNbNPVD1zbCZodZTCMTx-FzMPu7JS6ice4sY435BL8ync4lPnX_hU';
const API_URL = 'https://script.google.com/macros/s/' + API_ID + '/exec?name=timestamps';

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('songs');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalVideo, setModalVideo] = useState(null);
    const [showPinnedPost, setShowPinnedPost] = useState(false);
    const [pinnedPost, setPinnedPost] = useState(null);
    const [sortKey, setSortKey] = useState('playCount');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
    const [liveDateFrom, setLiveDateFrom] = useState('');
    const [liveDateTo, setLiveDateTo] = useState('');

    useEffect(() => {
        fetchData();
        fetchPinnedPost();
    }, []);

    // Twitter widgetsの再初期化
    useEffect(() => {
        if (showPinnedPost && pinnedPost) {
            // Twitter widgets が読み込まれるのを待ってから初期化
            const initializeTwitterWidget = () => {
                if (window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.load();
                } else {
                    // Twitter widgets がまだ読み込まれていない場合、少し待ってから再試行
                    setTimeout(initializeTwitterWidget, 500);
                }
            };
            
            // モーダルが表示された後に少し遅延させて初期化
            setTimeout(initializeTwitterWidget, 300);
        }
    }, [showPinnedPost, pinnedPost]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 固定ポスト情報を取得
    const fetchPinnedPost = async () => {
        try {
            const response = await fetch('../pinned_post_blockquote.html');
            if (response.ok) {
                const htmlContent = await response.text();
                setPinnedPost(htmlContent);
            }
        } catch (err) {
            console.log('固定ポスト情報の取得をスキップしました:', err.message);
        }
    };

    // 楽曲ごとにタイムスタンプをグループ化
    const groupTimestampsBySong = () => {
        if (!data) return {};
        
        const songMap = {};
        data.songs.forEach(song => {
            songMap[song.mng_music_id] = {
                ...song,
                timestamps: []
            };
        });

        data.timestamps.forEach(timestamp => {
            if (songMap[timestamp.mng_music_id]) {
                const live = data.lives.find(l => l.mng_live_id === timestamp.mng_live_id);
                songMap[timestamp.mng_music_id].timestamps.push({
                    ...timestamp,
                    live
                });
            }
        });

        return songMap;
    };

    // ライブごとにタイムスタンプをグループ化
    const groupTimestampsByLive = () => {
        if (!data) return {};
        
        const liveMap = {};
        data.lives.forEach(live => {
            liveMap[live.mng_live_id] = {
                ...live,
                timestamps: []
            };
        });

        data.timestamps.forEach(timestamp => {
            if (liveMap[timestamp.mng_live_id]) {
                const song = data.songs.find(s => s.mng_music_id === timestamp.mng_music_id);
                liveMap[timestamp.mng_live_id].timestamps.push({
                    ...timestamp,
                    song
                });
            }
        });

        return liveMap;
    };

    // 時間を MM:SS 形式に変換
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // フィルタリング
    const filterData = (items, searchTerm) => {
        if (!searchTerm) return items;
        const term = searchTerm.toLowerCase();
        return items.filter(item => 
            (item.title && item.title.toLowerCase().includes(term)) ||
            (item.artist && item.artist.toLowerCase().includes(term))
        );
    };

    // YouTube URLからビデオIDを抽出
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    };

    // モーダルでYouTube動画を開く
    const openVideoModal = (url, timestamp = 0) => {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
            setModalVideo({
                videoId,
                timestamp
            });
        }
    };

    // モーダルを閉じる
    const closeVideoModal = () => {
        setModalVideo(null);
    };

    // 固定ポストポップアップを開く/閉じる
    const togglePinnedPost = () => {
        setShowPinnedPost(!showPinnedPost);
    };

    // 楽曲一覧のソート
    const sortSongs = (songs, key, order) => {
        const sorted = [...songs];
        sorted.sort((a, b) => {
            switch (key) {
                case 'playCount':
                    return order === 'desc'
                        ? b.timestamps.length - a.timestamps.length
                        : a.timestamps.length - b.timestamps.length;
                case 'latestLive':
                    // 最新の歌った配信日（降順:新しい順, 昇順:古い順）
                    const bLatest = b.timestamps.length > 0
                        ? Math.max(...b.timestamps.map(ts => new Date(ts.live.date).getTime()))
                        : 0;
                    const aLatest = a.timestamps.length > 0
                        ? Math.max(...a.timestamps.map(ts => new Date(ts.live.date).getTime()))
                        : 0;
                    return order === 'desc' ? bLatest - aLatest : aLatest - bLatest;
                case 'oldestLive':
                    // 最古の歌った配信日（降順:新しい順, 昇順:古い順）
                    const bOldest = b.timestamps.length > 0
                        ? Math.min(...b.timestamps.map(ts => new Date(ts.live.date).getTime()))
                        : 0;
                    const aOldest = a.timestamps.length > 0
                        ? Math.min(...a.timestamps.map(ts => new Date(ts.live.date).getTime()))
                        : 0;
                    return order === 'desc' ? bOldest - aOldest : aOldest - bOldest;
                case 'artist':
                    return order === 'desc'
                        ? (b.artist || '').localeCompare(a.artist || '')
                        : (a.artist || '').localeCompare(b.artist || '');
                case 'title':
                    return order === 'desc'
                        ? (b.title || '').localeCompare(a.title || '')
                        : (a.title || '').localeCompare(b.title || '');
                default:
                    return 0;
            }
        });
        return sorted;
    };

    // ライブ配信日フィルター（範囲指定対応）
    const filterLivesByDate = (lives, from, to) => {
        if (!from && !to) return lives;
        return lives.filter(live => {
            const liveDate = new Date(live.date);
            const fromDate = from ? new Date(from) : null;
            const toDate = to ? new Date(to) : null;
            if (fromDate && liveDate < fromDate) return false;
            if (toDate && liveDate > toDate) return false;
            return true;
        });
    };

    if (loading) {
        return (
            <div className="container">
                <div className="loading">
                    🎵 データを読み込み中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="error">
                    ❌ エラー: {error}
                    <br />
                    <button onClick={fetchData} style={{marginTop: '10px', padding: '8px 16px', cursor: 'pointer'}}>
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    const songsData = Object.values(groupTimestampsBySong());
    const livesData = Object.values(groupTimestampsByLive());
    // 配信日が新しい順にソート
    const sortedLives = livesData.sort((a, b) => new Date(b.date) - new Date(a.date));
    const filteredSongs = filterData(songsData, searchTerm);
    const sortedSongs = sortSongs(filteredSongs, sortKey, sortOrder);
    const filteredLives = filterData(sortedLives, searchTerm);
    const dateFilteredLives = filterLivesByDate(filteredLives, liveDateFrom, liveDateTo);

    return (
        <div className="container">
            <div className="header">
                <h1>🌟 星降こゆ 楽曲・ライブ管理システム</h1>
                <p>楽曲とライブ配信の情報を管理・検索できます</p>
                {pinnedPost && (
                    <div className="pinned-post-notice">
                        <button 
                            onClick={togglePinnedPost}
                            className="pinned-post-button"
                        >
                            📌 固定ツイートを表示
                        </button>
                    </div>
                )}
            </div>

            <div className="stats">
                <div className="stat-card">
                    <div className="stat-number">{data?.songs?.length || 0}</div>
                    <div className="stat-label">楽曲数</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{data?.lives?.length || 0}</div>
                    <div className="stat-label">ライブ配信数</div>
                </div>
            </div>

            <input
                type="text"
                className="search-box"
                placeholder="楽曲名やアーティスト名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'songs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('songs')}
                >
                    🎵 楽曲一覧 ({filteredSongs.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'lives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lives')}
                >
                    📺 ライブ一覧 ({dateFilteredLives.length})
                </button>
            </div>

            {/* 楽曲一覧タブのソートUI */}
            {activeTab === 'songs' && (
                <div className="sort-controls" style={{marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <label>ソート:</label>
                    <select value={sortKey} onChange={e => setSortKey(e.target.value)}>
                        <option value="playCount">演奏回数</option>
                        <option value="latestLive">最新の歌った配信日</option>
                        <option value="oldestLive">最古の歌った配信日</option>
                        <option value="artist">アーティスト</option>
                        <option value="title">曲名</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        style={{padding: '2px 8px'}}
                        title={sortOrder === 'asc' ? '昇順' : '降順'}
                    >
                        {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                    </button>
                </div>
            )}

            {/* ライブ一覧タブのカレンダーフィルター（範囲指定・専用デザイン） */}
            {activeTab === 'lives' && (
                <LiveDateRangeFilter
                    from={liveDateFrom}
                    to={liveDateTo}
                    setFrom={setLiveDateFrom}
                    setTo={setLiveDateTo}
                />
            )}

            <div className="content">
                {activeTab === 'songs' && (
                    <SongsList songs={sortedSongs} formatTime={formatTime} openVideoModal={openVideoModal} />
                )}
                {activeTab === 'lives' && (
                    <LivesList lives={dateFilteredLives} formatTime={formatTime} openVideoModal={openVideoModal} />
                )}
            </div>

            {/* YouTube動画モーダル */}
            {modalVideo && (
                <div className="modal show" onClick={closeVideoModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="modal-close" onClick={closeVideoModal}>&times;</span>
                        <div className="video-container">
                            <iframe
                                className="youtube-iframe"
                                src={`https://www.youtube.com/embed/${modalVideo.videoId}?start=${modalVideo.timestamp}&autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* 固定ポストポップアップ */}
            {showPinnedPost && pinnedPost && (
                <div className="modal show" onClick={togglePinnedPost}>
                    <div className="modal-content pinned-post-modal" onClick={(e) => e.stopPropagation()}>
                        <span className="modal-close" onClick={togglePinnedPost}>&times;</span>
                        <div className="pinned-post-content">
                            <h2>📌 固定ツイート</h2>
                            <div 
                                dangerouslySetInnerHTML={{ __html: pinnedPost }}
                                className="blockquote-container"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 楽曲一覧コンポーネント
function SongsList({ songs, formatTime, openVideoModal }) {
    return (
        <div className="grid">
            {songs.map(song => (
                <div key={song.mng_music_id} className="card song-card">
                    <div className="card-title">{song.title || '未設定'}</div>
                    <div className="card-subtitle">🎤 {song.artist || '不明'}</div>
                    <div className="card-info">
                        🎵 演奏回数: {song.timestamps.length}回
                    </div>
                    
                    {song.timestamps.length > 0 && (
                        <div className="timestamp-list">
                            <strong>📺 歌った配信:</strong>
                            {song.timestamps.map(ts => (
                                <div key={ts.mng_timestamp_id} className="timestamp-item">
                                    <a 
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            openVideoModal(ts.live.url, ts.start_timestamp);
                                        }}
                                        className="live-link"
                                    >
                                        {ts.live.title.substring(0, 50)}...
                                    </a>
                                    <br />
                                    <small>
                                        ⏰ {formatTime(ts.start_timestamp)} - 
                                        📅 {new Date(ts.live.date).toLocaleDateString('ja-JP')}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ライブ一覧コンポーネント
function LivesList({ lives, formatTime, openVideoModal }) {
    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.nextElementSibling.style.display = 'flex';
    };

    return (
        <div className="grid">
            {lives.map(live => (
                <div key={live.mng_live_id} className="card live-card">
                    {live.thumbnail && (
                        <div className="live-thumbnail">
                            <img 
                                src={live.thumbnail} 
                                alt={`${live.title}のサムネイル`}
                                className="thumbnail-image"
                                onClick={() => openVideoModal(live.url, 0)}
                                onError={handleImageError}
                            />
                            <div className="thumbnail-fallback" style={{display: 'none'}}>
                                <div className="fallback-content">
                                    <span>📺</span>
                                    <p>サムネイル画像を<br />読み込めませんでした</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="card-title">{live.title}</div>
                    <div className="card-info">
                        📅 {new Date(live.date).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="card-info">
                        🎵 歌った楽曲数: {live.timestamps.length}曲
                    </div>
                    
                    <a 
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            openVideoModal(live.url, 0);
                        }}
                        className="youtube-link"
                    >
                        📺 YouTubeで視聴
                    </a>

                    {live.timestamps.length > 0 && (
                        <div className="timestamp-list">
                            <strong>🎵 歌った楽曲:</strong>
                            {live.timestamps
                                .sort((a, b) => a.start_timestamp - b.start_timestamp)
                                .map(ts => (
                                <div key={ts.mng_timestamp_id} className="timestamp-item">
                                    <a 
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            openVideoModal(live.url, ts.start_timestamp);
                                        }}
                                        className="live-link"
                                    >
                                        {ts.song.title || '楽曲名不明'}
                                    </a>
                                    <br />
                                    <small>
                                        ⏰ {formatTime(ts.start_timestamp)} - 
                                        🎤 {ts.song.artist || 'アーティスト不明'}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// 配信日範囲フィルター専用フォームコンポーネント
function LiveDateRangeFilter({ from, to, setFrom, setTo }) {
    return (
        <form
            className="live-date-range-filter"
            style={{
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: '#f7f7fa',
                padding: '10px 16px',
                borderRadius: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}
            onSubmit={e => e.preventDefault()}
        >
            <label style={{fontWeight: 'bold'}}>配信日で絞り込み:</label>
            <span>
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                />
                <span style={{margin: '0 6px'}}>〜</span>
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                />
            </span>
            {(from || to) && (
                <button
                    type="button"
                    onClick={() => { setFrom(''); setTo(''); }}
                    style={{
                        padding: '2px 10px',
                        marginLeft: '8px',
                        background: '#eee',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    クリア
                </button>
            )}
        </form>
    );
}

// アプリケーションをレンダリング
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
