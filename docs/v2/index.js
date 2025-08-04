const { useState, useEffect } = React;

// APIから楽曲・ライブデータを取得
const API_URL = 'https://script.google.com/macros/s/AKfycbyK7LEJ21s5ZPTQpPIiZiP1aiRlT4m1qZdxgSGSx7XlFb_T3vFyfGW03RPAKNGid5OO/exec?name=timestamps';

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('songs');
    const [searchTerm, setSearchTerm] = useState('');
    const [modalVideo, setModalVideo] = useState(null);
    const [videoError, setVideoError] = useState(null);
    const [forceDirectLink, setForceDirectLink] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            const result = await response.json();
            console.log('取得したデータ:', result);
            
            // データ構造の確認
            if (result.songs) {
                console.log('楽曲データの例:', result.songs[0]);
            }
            if (result.lives) {
                console.log('ライブデータの例:', result.lives[0]);
            }
            if (result.timestamps) {
                console.log('タイムスタンプデータの例:', result.timestamps[0]);
            }
            
            setData(result);
        } catch (err) {
            console.error('データ取得エラー:', err);
            setError(err.message);
        } finally {
            setLoading(false);
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
        
        // 様々なYouTube URL形式に対応
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        console.error('YouTube ビデオIDの抽出に失敗しました:', url);
        return null;
    };

    // モーダルでYouTube動画を開く
    const openVideoModal = (url, timestamp = 0, directLink = false) => {
        console.log('動画を開こうとしています:', { url, timestamp, directLink });
        setVideoError(null); // エラー状態をリセット
        setModalVideo(null); // モーダル状態もリセット
        setForceDirectLink(directLink);
        
        if (!url) {
            console.error('URLが提供されていません');
            setVideoError('動画URLが見つかりません');
            return;
        }
        
        const videoId = getYouTubeVideoId(url);
        console.log('抽出されたビデオID:', videoId);
        
        if (videoId) {
            // まずモーダルを表示してから少し遅延してiframeを設定
            setModalVideo({
                videoId,
                timestamp,
                originalUrl: url
            });
        } else {
            console.error('ビデオIDの抽出に失敗しました:', url);
            setVideoError('YouTubeのURLが正しくない可能性があります');
        }
    };

    // モーダルを閉じる
    const closeVideoModal = () => {
        setModalVideo(null);
        setVideoError(null);
        setForceDirectLink(false);
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
    const filteredSongs = filterData(songsData, searchTerm);
    const filteredLives = filterData(livesData, searchTerm);

    return (
        <div className="container">
            <div className="header">
                <h1>🌟 星降こゆ 楽曲・ライブ管理システム</h1>
                <p>楽曲とライブ配信の情報を管理・検索できます</p>
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
                <div className="stat-card">
                    <div className="stat-number">{data?.timestamps?.length || 0}</div>
                    <div className="stat-label">タイムスタンプ数</div>
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
                    📺 ライブ一覧 ({filteredLives.length})
                </button>
            </div>

            <div className="content">
                {activeTab === 'songs' && (
                    <SongsList songs={filteredSongs} formatTime={formatTime} openVideoModal={openVideoModal} />
                )}
                {activeTab === 'lives' && (
                    <LivesList lives={filteredLives} formatTime={formatTime} openVideoModal={openVideoModal} />
                )}
            </div>

            {/* YouTube動画モーダル */}
            {(modalVideo || videoError) && (
                <div className="modal show" onClick={closeVideoModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="modal-close" onClick={closeVideoModal}>&times;</span>
                        {videoError ? (
                            <div className="video-error">
                                <h3>🚫 動画を再生できません</h3>
                                <p>{videoError}</p>
                                <p>以下の方法で動画を視聴してください：</p>
                                <a 
                                    href={modalVideo?.originalUrl || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="youtube-direct-link"
                                    style={{fontSize: '16px', padding: '10px 20px', display: 'inline-block'}}
                                >
                                    YouTubeで開く
                                </a>
                            </div>
                        ) : modalVideo ? (
                            <VideoPlayer 
                                modalVideo={modalVideo} 
                                setVideoError={setVideoError} 
                                forceDirectLink={forceDirectLink}
                            />
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

// YouTube動画プレイヤーコンポーネント
function VideoPlayer({ modalVideo, setVideoError, forceDirectLink = false }) {
    const [showFallback, setShowFallback] = useState(forceDirectLink);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [autoplayFailed, setAutoplayFailed] = useState(false);

    useEffect(() => {
        // forceDirectLinkがtrueの場合は最初からフォールバック表示
        if (forceDirectLink) {
            setShowFallback(true);
            return;
        }

        // 5秒後にiframeが読み込まれていない場合はフォールバックを表示
        const timeout = setTimeout(() => {
            if (!iframeLoaded) {
                console.log('iframe の読み込みタイムアウト、フォールバック表示に切り替え');
                setShowFallback(true);
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [iframeLoaded, forceDirectLink]);

    const handleIframeLoad = () => {
        console.log('iframe loaded successfully');
        setIframeLoaded(true);
        setVideoError(null);
        
        // autoplay が失敗している可能性を検出するためのタイマー
        setTimeout(() => {
            if (iframeLoaded && !autoplayFailed) {
                console.log('autoplay が失敗している可能性があります');
                setAutoplayFailed(true);
            }
        }, 3000);
    };

    const handleIframeError = (e) => {
        console.error('iframe エラー:', e);
        setShowFallback(true);
        setVideoError('動画の埋め込みに失敗しました');
    };

    if (showFallback) {
        return (
            <div className="video-error">
                <h3>📺 YouTube動画</h3>
                <p>{forceDirectLink ? 'YouTube で動画を直接ご覧ください：' : '埋め込み再生に問題があります。下のリンクからYouTubeで直接ご覧ください：'}</p>
                <div style={{margin: '20px 0', fontSize: '14px', color: '#ccc'}}>
                    <strong>ビデオID: {modalVideo.videoId}</strong>
                </div>
                <a 
                    href={`https://www.youtube.com/watch?v=${modalVideo.videoId}&t=${modalVideo.timestamp}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-direct-link"
                    style={{fontSize: '18px', padding: '15px 30px', display: 'inline-block', marginBottom: '15px'}}
                >
                    🎬 YouTubeで開く
                </a>
                <div style={{fontSize: '14px', color: '#bbb'}}>
                    開始時間: {Math.floor(modalVideo.timestamp / 60)}:{(modalVideo.timestamp % 60).toString().padStart(2, '0')}
                </div>
                {!forceDirectLink && (
                    <div style={{marginTop: '15px'}}>
                        <button 
                            onClick={() => {
                                setShowFallback(false);
                                setIframeLoaded(false);
                                setAutoplayFailed(false);
                            }}
                            style={{
                                padding: '8px 16px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            埋め込み再生を再試行
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="video-container">
            <iframe
                key={`${modalVideo.videoId}-${modalVideo.timestamp}-${Date.now()}`}
                className="youtube-iframe"
                src={`https://www.youtube.com/embed/${modalVideo.videoId}?start=${modalVideo.timestamp}&autoplay=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
            ></iframe>
            
            {autoplayFailed && (
                <div className="autoplay-notice" style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    🔇 自動再生がブロックされています。動画をクリックして再生してください。
                </div>
            )}
            
            <div className="video-fallback">
                <p>動画が再生されない場合は、下のリンクからYouTubeで直接ご覧ください：</p>
                <a 
                    href={`https://www.youtube.com/watch?v=${modalVideo.videoId}&t=${modalVideo.timestamp}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-direct-link"
                >
                    YouTubeで開く
                </a>
                {!iframeLoaded && (
                    <div style={{marginTop: '10px', fontSize: '14px', color: '#ccc'}}>
                        動画を読み込み中... (5秒後に代替表示に切り替わります)
                    </div>
                )}
                <div style={{marginTop: '10px'}}>
                    <button 
                        onClick={() => setShowFallback(true)}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        埋め込みをスキップ
                    </button>
                </div>
            </div>
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
                                            console.log('楽曲からクリック:', { liveUrl: ts.live.url, timestamp: ts.start_timestamp });
                                            openVideoModal(ts.live.url, ts.start_timestamp);
                                        }}
                                        className="live-link"
                                    >
                                        {ts.live.title.substring(0, 50)}...
                                    </a>
                                    <span 
                                        style={{marginLeft: '10px'}}
                                    >
                                        <a 
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openVideoModal(ts.live.url, ts.start_timestamp, true);
                                            }}
                                            className="live-link"
                                            style={{fontSize: '12px', color: '#999'}}
                                            title="YouTubeで直接開く"
                                        >
                                            [直接開く]
                                        </a>
                                    </span>
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
    return (
        <div className="grid">
            {lives.map(live => (
                <div key={live.mng_live_id} className="card live-card">
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
                            console.log('ライブからクリック:', { liveUrl: live.url, timestamp: 0 });
                            openVideoModal(live.url, 0);
                        }}
                        className="youtube-link"
                    >
                        📺 YouTubeで視聴
                    </a>
                    <span style={{marginLeft: '10px'}}>
                        <a 
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                openVideoModal(live.url, 0, true);
                            }}
                            className="youtube-link"
                            style={{fontSize: '12px'}}
                            title="YouTubeで直接開く"
                        >
                            [直接開く]
                        </a>
                    </span>

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
                                            console.log('ライブ内楽曲からクリック:', { liveUrl: live.url, timestamp: ts.start_timestamp });
                                            openVideoModal(live.url, ts.start_timestamp);
                                        }}
                                        className="live-link"
                                    >
                                        {ts.song.title || '楽曲名不明'}
                                    </a>
                                    <span style={{marginLeft: '10px'}}>
                                        <a 
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                openVideoModal(live.url, ts.start_timestamp, true);
                                            }}
                                            className="live-link"
                                            style={{fontSize: '12px', color: '#999'}}
                                            title="YouTubeで直接開く"
                                        >
                                            [直接開く]
                                        </a>
                                    </span>
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

// アプリケーションをレンダリング
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
