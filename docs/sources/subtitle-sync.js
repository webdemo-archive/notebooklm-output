// SRTファイルをパースする関数
function parseSRT(srtContent) {
    const subtitles = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const timeLine = lines[1];
            // タイムスタンプの正規表現パターン
            const pattern = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/;
            const timeMatch = timeLine.match(pattern);

            if (timeMatch) {
                const startTime =
                    parseInt(timeMatch[1]) * 3600 +
                    parseInt(timeMatch[2]) * 60 +
                    parseInt(timeMatch[3]) +
                    parseInt(timeMatch[4]) / 1000;

                const endTime =
                    parseInt(timeMatch[5]) * 3600 +
                    parseInt(timeMatch[6]) * 60 +
                    parseInt(timeMatch[7]) +
                    parseInt(timeMatch[8]) / 1000;

                const text = lines.slice(2).join(' ');

                subtitles.push({
                    start: startTime,
                    end: endTime,
                    text: text
                });
            }
        }
    }
    return subtitles;
}

// 現在時刻に対応する字幕を検索
function findCurrentSubtitle(subtitles, currentTime) {
    for (const subtitle of subtitles) {
        if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
            return subtitle.text;
        }
    }
    return null;
}

// 初期化
let subtitles = [];
const audioPlayer = document.getElementById('audioPlayer');
const subtitleText = document.getElementById('subtitleText');
let lastDisplayedText = '';

// SRTファイルを読み込む
fetch('sources/hr5news_radio.srt')
    .then(response => response.text())
    .then(srtContent => {
        subtitles = parseSRT(srtContent);
        console.log('SRT loaded:', subtitles.length, 'subtitles');
    })
    .catch(error => {
        console.error('SRT load error:', error);
        subtitleText.textContent = '字幕ファイルの読み込みに失敗しました';
    });

// 字幕更新関数
let isAnimating = false;

function updateSubtitle() {
    if (!audioPlayer.paused && !audioPlayer.ended) {
        const currentTime = audioPlayer.currentTime;
        const currentSubtitle = findCurrentSubtitle(subtitles, currentTime);

        // 字幕が見つかった場合
        if (currentSubtitle !== null) {
            if (currentSubtitle !== lastDisplayedText && !isAnimating) {
                isAnimating = true;

                // 1. スライドアウト開始（現在位置から上へ）
                subtitleText.classList.remove('anim-in');
                subtitleText.classList.add('anim-out');

                // 2. アニメーション完了後(150ms)にテキスト更新してスライドイン（下から上へ）
                setTimeout(() => {
                    subtitleText.textContent = currentSubtitle;
                    subtitleText.classList.remove('placeholder', 'anim-out');
                    subtitleText.classList.add('active', 'anim-in');
                    lastDisplayedText = currentSubtitle;

                    // アニメーション完了待ち（少し余裕を持たせる）
                    setTimeout(() => {
                        isAnimating = false;
                    }, 150);
                }, 150); // slideOutUpのdurationに合わせる
            }
        }
        // 字幕がない場合（...表示）
        else {
            if (lastDisplayedText !== '' && !isAnimating) {
                isAnimating = true;

                // 1. スライドアウト開始
                subtitleText.classList.remove('anim-in');
                subtitleText.classList.add('anim-out');

                // 2. アニメーション完了後にテキスト更新してスライドイン
                setTimeout(() => {
                    subtitleText.textContent = '...';
                    subtitleText.classList.remove('active', 'anim-out');
                    subtitleText.classList.add('placeholder', 'anim-in');
                    lastDisplayedText = '';

                    setTimeout(() => {
                        isAnimating = false;
                    }, 150);
                }, 150);
            }
        }
        // 再生中は毎フレーム更新をリクエスト
        requestAnimationFrame(updateSubtitle);
    }
}

// 再生開始時にループを開始
audioPlayer.addEventListener('play', () => {
    if (subtitleText.textContent === '2025年の生成AIと人材開発') {
        subtitleText.classList.add('placeholder');
    }
    requestAnimationFrame(updateSubtitle);
});

// 一時停止・終了時のイベント
audioPlayer.addEventListener('ended', () => {
    subtitleText.textContent = '▶ 再生が終了しました';
    subtitleText.classList.remove('active');
    subtitleText.classList.add('placeholder');
    lastDisplayedText = '';
});
