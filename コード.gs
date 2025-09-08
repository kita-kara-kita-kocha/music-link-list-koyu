const DEFAULT_SHEET_NAME = 'main';
const PASSWORD = 'koyuuta0822'; // セキュリティのため、実際のパスワードを設定してください

/**
  * Google Apps Script Web API
  *
  * GETリクエストでスプレッドシートのデータを取得
  * curl -X GET "https://script.google.com/macros/s/{デプロイID}/exec" \
  *   -H "Content-Type: application/json"
  *
  * POSTリクエストでスプレッドシートのデータを更新
  * curl -X POST "https://script.google.com/macros/s/{デプロイID}/exec" \
  *   -H "Content-Type: application/json" \
  *   -d '[
  *     {"action": "registerTimestamps", "live_url": "youtube.link", "timestamps": [
  *       {"title": "曲1", "artist": "アーティスト1", "start_timestamp": 333},
  *       {"title": "曲2", "artist": "アーティスト2", "start_timestamp": 555}
  *     ]},
  *   ]'
  */

/**
 * 指定したシートのデータを配列のオブジェクトとして取得
 */
function getSheetData(sheetName, includeUnderscoreColumns = false) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error('シートが見つかりません: ' + sheetName);
  const rows = sheet.getDataRange().getValues();
  const keys = rows.shift();
  return rows.map(row => {
    const obj = {};
    row.forEach((item, i) => {
      if (!includeUnderscoreColumns && String(keys[i]).startsWith('_')) return;
      obj[String(keys[i])] = item;
    });
    return obj;
  });
}

/**
 * GETリクエストでデータを返す
 * すべてのシートのデータを取得し、JSON形式で返す
 */
function doGet(e) {
  const sheetNames = SpreadsheetApp.getActive().getSheets().map(sheet => sheet.getName());
  const result = {};
  sheetNames.forEach(sheetName => {
    try {
      result[sheetName] = getSheetData(sheetName, true); // アンダースコアで始まる列も含める
    } catch (err) {
      result[sheetName] = { error: err.message };
    }
  });
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * パスワード認証を行う
 */
function authenticate(password) {
  if (password !== PASSWORD) {
    return ContentService.createTextOutput(JSON.stringify({ error: '認証に失敗しました' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエストでデータを更新
 * 
 * actionパラメーターに応じて、各種登録関数を呼び出す
 * 
 */
function doPost(e) {
  try {
    // POSTデータの存在確認
    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'POSTデータが見つかりません。リクエスト形式を確認してください。' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 認証を行う
    // const authResponse = authenticate(e);
    // if (authResponse.getContent() !== JSON.stringify({ success: true })) {
    //   return authResponse; // 認証失敗時は処理を中断
    // }
    
    const data = JSON.parse(e.postData.contents);
    
    if (!data.action) {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: 'actionパラメーターが指定されていません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = data.action;
    
    if (action === 'registerLives') {
      return registerLives(e);
    } else if (action === 'registerSongs') {
      return registerSongs(e);
    } else if (action === 'registerTimestamps') {
      return registerTimestamps(e);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        error: '不明なアクションです: ' + action 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'サーバーエラーが発生しました: ' + error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ライブ情報を登録
 * args:
 *   title: ライブタイトル
 *   url: ライブURL
 *   date: ライブ日付 (YYYY-MM-DD)
 *   thumbnail: サムネイルURL
 * return:
 *   新規登録した行のID、またはエラーメッセージ
 * POSTリクエストのボディにJSON形式でライブ情報を含める
 * 例: {"title": "ライブ1", "url": "youtube.link", "date": "2023-01-01", "thumbnail": "youtube.thumbnail.jpg"}
 */
function registerLives(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: 'POSTデータが見つかりません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    if (registerLivesCheck(data.url)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: '既に存在するURLです' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // データをスプレッドシートに書き込む処理を実装
    const sheet = SpreadsheetApp.getActive().getSheetByName('lives');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: 'livesシートが見つかりません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const addRow = sheet.getLastRow() + 1;
    const newRow = [
      addRow,
      data.title,
      data.url,
      data.date,
      data.thumbnail
    ];
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, id: addRow 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, error: 'エラーが発生しました: ' + error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
  * ライブ情報のURL重複チェック
  * args:
  *   url: チェックするURL
  * return:
  *   boolean: 存在する場合はtrue、存在しない場合はfalse
  */
function registerLivesCheck(url) {
  // URLの存在を確認
  const sheet = SpreadsheetApp.getActive().getSheetByName('lives');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'livesシートが見つかりません' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = getSheetData('lives', true);
  for (let i = 0; i < data.length; i++) {
    if (data[i].url === url) {
      return true; // URLが存在する
    }
  }
  return false; // URLが存在しない
}

/**
 * 曲情報を登録
 * POSTリクエストのボディにJSON形式で曲情報を含める
 * 例: {"title": "曲1", "artist": "アーティスト1"}
 */
function registerSongs(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: 'POSTデータが見つかりません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // 重複チェック
    if (registerSongsCheck(data.title, data.artist)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: '既に存在する曲名とアーティスト名の組み合わせです' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // データをスプレッドシートに書き込む処理を実装
    const sheet = SpreadsheetApp.getActive().getSheetByName('songs');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: 'songsシートが見つかりません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const addRow = sheet.getLastRow() + 1;
    const newRow = [
      addRow,
      data.title,
      data.artist
    ];
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, id: addRow 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, error: 'エラーが発生しました: ' + error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 曲情報の重複チェック
 * args:
 *   title: 曲名
 *   artist: アーティスト名
 * return:
 *   boolean: 存在する場合はtrue、存在しない場合はfalse
 */
function registerSongsCheck(title, artist) {
  // 曲名とアーティスト名の組み合わせの存在を確認
  const sheet = SpreadsheetApp.getActive().getSheetByName('songs');
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'songsシートが見つかりません' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = getSheetData('songs', true);
  for (let i = 0; i < data.length; i++) {
    if (data[i].title === title && data[i].artist === artist) {
      return true; // 曲名とアーティスト名の組み合わせが存在する
    }
  }
  return false; // 曲名とアーティスト名の組み合わせが存在しない
}

/**
 * タイムスタンプ情報を登録
 * 未登録のライブURLと曲情報はそれぞれregisterLives、registerSongsで登録する
 * 未登録のタイムスタンプ情報のみ登録する
 *
 * args:
 *   live_url: ライブURL
 *   timestamps(list): [
 *     {"title": "曲1", "artist": "アーティスト1", "start_timestamp": 333},
 *     {"title": "曲2", "artist": "アーティスト2", "start_timestamp": 444}
 *   ]
 * return:
 *   曲毎の登録結果の配列
 * POSTリクエストのボディにJSON形式でタイムスタンプ情報を含める
 * 例: {"action": "registerTimestamps", "live_url": "youtube.link", "title": "ライブタイトル", "date": "2023-01-01", "thumbnail": "thumb.jpg", "timestamps": [{"title": "曲1", "artist": "アーティスト1", "start_timestamp": 333}]}
 */
function registerTimestamps(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, error: 'POSTデータが見つかりません' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActive().getSheetByName('timestamps');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'timestampsシートが見つかりません' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const livesData = getSheetData('lives', true);
    const songsData = getSheetData('songs', true);
    
    // live_urlからmng_live_idを取得
    const foundLive = livesData.find(live => live.url === data.live_url);
    let mng_live_id = foundLive ? foundLive.mng_live_id : 0;
    
    if (!mng_live_id) {
      // ライブURLが存在しない場合はregisterLivesHelperで登録する
      const registerResult = registerLivesHelper({
        title: data.title,
        url: data.live_url,
        date: data.date,
        thumbnail: data.thumbnail
      });
      
      if (registerResult.success) {
        mng_live_id = registerResult.id;
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 
          error: 'ライブ情報の登録に失敗しました: ' + registerResult.error 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    const results = [];
    
    data.timestamps.forEach(timestamp => {
      try {
        // titleとartistからmng_music_idを取得
        const foundSong = songsData.find(song => song.title === timestamp.title && song.artist === timestamp.artist);
        let mng_music_id = foundSong ? foundSong.mng_music_id : 0;
        
        if (!mng_music_id) {
          // 曲情報が存在しない場合はregisterSongsHelperで登録する
          const registerResult = registerSongsHelper({
            title: timestamp.title,
            artist: timestamp.artist
          });
          
          if (registerResult.success) {
            mng_music_id = registerResult.id;
          } else {
            results.push({ success: false, error: '曲情報の登録に失敗しました: ' + registerResult.error, title: timestamp.title, artist: timestamp.artist });
            return;
          }
        }
        
        // タイムスタンプの重複チェック
        if (registerTimestampsCheck(mng_live_id, mng_music_id)) {
          results.push({ success: false, error: '既に存在するタイムスタンプです', title: timestamp.title, artist: timestamp.artist });
          return;
        }
        
        // データをスプレッドシートに書き込む処理を実装
        const addRow = sheet.getLastRow() + 1;
        const newRow = [
          addRow,
          mng_music_id,
          mng_live_id,
          timestamp.timestamp
        ];
        sheet.appendRow(newRow);
        results.push({ success: true, id: addRow, title: timestamp.title, artist: timestamp.artist });
      } catch (timestampError) {
        results.push({ success: false, error: 'タイムスタンプ処理エラー: ' + timestampError.message, title: timestamp.title, artist: timestamp.artist });
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({ results }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'エラーが発生しました: ' + error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * タイムスタンプの重複チェック
 * args:
 *   mng_live_id: ライブID
 *   mng_music_id: 曲ID
 *   start_timestamp: 開始タイムスタンプ
 * return:
 *   boolean: 存在する場合はtrue、存在しない場合はfalse
 */
function registerTimestampsCheck(mng_live_id, mng_music_id) {
  // ライブID、曲ID、開始タイムスタンプの組み合わせの存在を確認
  const sheet = SpreadsheetApp.getActive().getSheetByName('timestamps');
  if (!sheet) {
    return false;
  }
  const data = getSheetData('timestamps', true);
  for (let i = 0; i < data.length; i++) {
    if (data[i].mng_live_id === mng_live_id && data[i].mng_music_id === mng_music_id) {
      return true; // 組み合わせが存在する
    }
  }
  return false; // 組み合わせが存在しない
}

/**
 * ライブ情報をヘルパー関数として登録（内部呼び出し用）
 * args:
 *   data: {title, url, date, thumbnail}
 * return:
 *   {success: boolean, id?: number, error?: string}
 */
function registerLivesHelper(data) {
  try {
    if (registerLivesCheck(data.url)) {
      return { success: false, error: '既に存在するURLです' };
    }
    
    const sheet = SpreadsheetApp.getActive().getSheetByName('lives');
    if (!sheet) {
      return { success: false, error: 'livesシートが見つかりません' };
    }
    
    const addRow = sheet.getLastRow() + 1;
    const newRow = [
      addRow,
      data.title,
      data.url,
      data.date,
      data.thumbnail
    ];
    sheet.appendRow(newRow);
    
    return { success: true, id: addRow };
  } catch (error) {
    return { success: false, error: 'エラーが発生しました: ' + error.message };
  }
}

/**
 * 曲情報をヘルパー関数として登録（内部呼び出し用）
 * args:
 *   data: {title, artist}
 * return:
 *   {success: boolean, id?: number, error?: string}
 */
function registerSongsHelper(data) {
  try {
    if (registerSongsCheck(data.title, data.artist)) {
      return { success: false, error: '既に存在する曲名とアーティスト名の組み合わせです' };
    }
    
    const sheet = SpreadsheetApp.getActive().getSheetByName('songs');
    if (!sheet) {
      return { success: false, error: 'songsシートが見つかりません' };
    }
    
    const addRow = sheet.getLastRow() + 1;
    const newRow = [
      addRow,
      data.title,
      data.artist
    ];
    sheet.appendRow(newRow);
    
    return { success: true, id: addRow };
  } catch (error) {
    return { success: false, error: 'エラーが発生しました: ' + error.message };
  }
}