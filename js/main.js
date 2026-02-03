/**
 * Main - 游戏主循环和初始化
 * 指尖跳动 (Finger Flow)
 */

class Game {
    constructor() {
        this.isRunning = false;
        this.isReady = false;
        this.hasMusic = false;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        
        // UI 元素
        this.timeDisplay = null;
        this.scoreDisplay = null;
        this.comboDisplay = null;
        this.musicInfoDisplay = null;
        this.musicLoader = null;
        this.musicStatus = null;
        
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        console.log('🎮 指尖跳动 (Finger Flow) - 初始化中...');
        
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }
    
    /**
     * DOM 加载完成后的回调
     */
    async onDOMReady() {
        // 获取 UI 元素
        this.timeDisplay = document.getElementById('time-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.comboDisplay = document.getElementById('combo-display');
        this.musicInfoDisplay = document.getElementById('music-info-display');
        this.musicLoader = document.getElementById('music-loader');
        this.musicStatus = document.getElementById('music-status');
        
        // 设置输入回调
        inputManager.onTrackHit = (trackIndex) => this.handleTrackHit(trackIndex);
        
        // 初始化音频系统
        await audioManager.init();
        
        // 设置音乐加载按钮
        this.setupMusicLoader();
        
        // 添加空格键暂停/继续功能
        this.setupPauseControl();
        
        console.log('✅ 游戏初始化完成');
        console.log('🎵 请加载音乐文件或选择无音乐模式开始游戏');
        console.log('⏸️ 提示：按空格键可以暂停/继续游戏');
        console.log('🎹 操作按键：Z、C、←、→');
    }
    
    /**
     * 设置暂停控制（空格键）
     */
    setupPauseControl() {
        document.addEventListener('keydown', async (e) => {
            // 只在游戏准备好之后才响应空格键
            if (!this.isReady) return;
            
            // 空格键暂停/继续
            if (e.code === 'Space' || e.keyCode === 32) {
                e.preventDefault(); // 防止页面滚动
                
                if (this.isRunning) {
                    this.pause();
                    this.showPauseOverlay();
                } else {
                    await this.resume();
                    this.hidePauseOverlay();
                }
            }
            
            // ESC 键也可以暂停
            if (e.code === 'Escape' || e.keyCode === 27) {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                    this.showPauseOverlay();
                }
            }
            
            // R 键重新开始（游戏暂停时）
            if ((e.code === 'KeyR' || e.keyCode === 82) && !this.isRunning && this.isReady) {
                e.preventDefault();
                this.hidePauseOverlay();
                this.reset();
                this.startGame();
                console.log('🔄 游戏重新开始');
            }
        });
    }
    
    /**
     * 显示暂停遮罩
     */
    showPauseOverlay() {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.className = 'pause-overlay';
            overlay.innerHTML = `
                <div class="pause-content">
                    <h2>⏸️ 游戏已暂停</h2>
                    <p>按 <strong>空格键</strong> 继续游戏</p>
                    <p>按 <strong>R</strong> 键重新开始</p>
                    <div class="pause-stats">
                        <div>当前分数: <span id="pause-score">0</span></div>
                        <div>连击: <span id="pause-combo">0</span></div>
                    </div>
                </div>
            `;
            document.getElementById('game-container').appendChild(overlay);
        }
        
        // 更新统计数据
        const stats = noteManager.getStats();
        const scoreSpan = document.getElementById('pause-score');
        const comboSpan = document.getElementById('pause-combo');
        if (scoreSpan) scoreSpan.textContent = stats.score;
        if (comboSpan) comboSpan.textContent = stats.combo;
        
        overlay.style.display = 'flex';
        console.log('⏸️ 游戏已暂停（按空格键继续）');
    }
    
    /**
     * 隐藏暂停遮罩
     */
    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        console.log('▶️ 游戏继续');
    }
    
    /**
     * 设置音乐加载器
     */
    async setupMusicLoader() {
        const loadMusicBtn = document.getElementById('load-music-btn');
        const startWithoutMusicBtn = document.getElementById('start-without-music-btn');
        const startGameBtn = document.getElementById('start-game-btn');
        const startGameContainer = document.getElementById('start-game-container');
        const musicFileInput = document.getElementById('music-file-input');
        
        // 尝试自动加载默认音乐
        this.updateStatus('正在自动加载音乐...');
        const autoLoaded = await audioManager.tryAutoLoadMusic();
        
        if (autoLoaded) {
            this.hasMusic = true;
            this.updateStatus('✅ 音乐加载成功！');
            
            // 根据音乐 BPM 生成谱面
            const chart = audioManager.generateChartFromBPM();
            noteManager.loadChart(chart);
            
            // 设置 BPM
            const musicInfo = audioManager.getMusicInfo();
            conductor.setBPM(musicInfo.bpm);
            
            // 显示启动游戏按钮
            if (startGameContainer) startGameContainer.style.display = 'block';
            if (loadMusicBtn) loadMusicBtn.style.display = 'none';
            if (startWithoutMusicBtn) startWithoutMusicBtn.style.display = 'none';
            
            // 绑定启动按钮
            this.setupStartButton();
            return;
        } else {
            this.updateStatus('未找到音乐文件，请手动加载或无音乐开始');
        }
        
        // 加载音乐按钮
        loadMusicBtn.addEventListener('click', () => {
            musicFileInput.click();
        });
        
        // 文件选择
        musicFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                this.updateStatus('正在加载音乐...');
                const url = URL.createObjectURL(file);
                const success = await audioManager.loadMusic(url);
                
                if (success) {
                    this.hasMusic = true;
                    this.updateStatus('✅ 音乐加载成功！');
                    
                    // 根据音乐 BPM 生成谱面
                    const chart = audioManager.generateChartFromBPM();
                    noteManager.loadChart(chart);
                    
                    // 设置 BPM
                    const musicInfo = audioManager.getMusicInfo();
                    conductor.setBPM(musicInfo.bpm);
                    
                    // 显示启动游戏按钮
                    const startGameContainer = document.getElementById('start-game-container');
                    if (startGameContainer) startGameContainer.style.display = 'block';
                    if (loadMusicBtn) loadMusicBtn.style.display = 'none';
                    if (startWithoutMusicBtn) startWithoutMusicBtn.style.display = 'none';
                    
                    // 绑定启动按钮
                    this.setupStartButton();
                } else {
                    this.updateStatus('❌ 音乐加载失败，请重试');
                }
            }
        });
        
        // 无音乐开始按钮
        startWithoutMusicBtn.addEventListener('click', () => {
            this.hasMusic = false;
            this.updateStatus('开始无音乐测试模式...');
            
            // 生成测试谱面
            noteManager.generateTestChart();
            conductor.setBPM(120);
            
            this.startGame();
        });
    }
    
    /**
     * 设置启动按钮
     */
    setupStartButton() {
        const startGameBtn = document.getElementById('start-game-btn');
        
        // 点击按钮启动
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGame();
            }, { once: true });
        }
        
        // 监听 Enter 键启动
        const handleEnter = (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                document.removeEventListener('keydown', handleEnter);
                this.startGame();
            }
        };
        
        document.addEventListener('keydown', handleEnter);
    }
    
    /**
     * 开始游戏
     */
    async startGame() {
        // 隐藏加载界面
        if (this.musicLoader) {
            this.musicLoader.classList.add('hidden');
        }
        
        // 启动 Conductor
        conductor.start();
        
        // 如果有音乐，播放音乐并显示音乐信息
        if (this.hasMusic) {
            await audioManager.play();
            this.showMusicInfo();
            console.log('🎵 音乐开始播放');
        }
        
        // 启动游戏循环
        this.isReady = true;
        this.start();
        
        console.log('▶️ 游戏开始！');
        console.log('🎹 使用键盘 Z、C、←、→ 或点击/触摸底部判定框进行游戏');
    }
    
    /**
     * 显示音乐信息
     */
    showMusicInfo() {
        if (!this.musicInfoDisplay) return;
        
        const info = audioManager.getMusicInfo();
        this.musicInfoDisplay.innerHTML = `
            <div class="music-meta">
                <div class="music-title">♪ ${info.title}</div>
                <div class="music-artist">${info.artist}</div>
                <div class="music-bpm">${info.bpm} BPM</div>
            </div>
        `;
        this.musicInfoDisplay.style.display = 'block';
        
        // 5秒后淡出
        setTimeout(() => {
            if (this.musicInfoDisplay) {
                this.musicInfoDisplay.style.opacity = '0';
            }
        }, 5000);
    }
    
    /**
     * 更新状态文本
     */
    updateStatus(text) {
        if (this.musicStatus) {
            this.musicStatus.textContent = text;
        }
    }
    
    /**
     * 启动游戏循环
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // 启动主循环
        this.gameLoop(this.lastFrameTime);
        
        console.log('▶️ 游戏开始');
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        this.isRunning = false;
        conductor.pause();
        if (this.hasMusic) {
            audioManager.pause();
        }
        console.log('⏸️ 游戏暂停');
    }
    
    /**
     * 恢复游戏
     */
    async resume() {
        if (this.isRunning) return;
        
        console.log('⏯️ 正在恢复游戏...');
        
        // 恢复音乐
        if (this.hasMusic) {
            await audioManager.play();
        }
        
        // 重置状态并启动游戏循环
        this.isRunning = true;
        
        // 使用 requestAnimationFrame 来正确启动游戏循环
        // 在回调中同步设置 conductor 的时间基准，确保时间戳匹配
        requestAnimationFrame((timestamp) => {
            // 在这里启动 conductor，使用 requestAnimationFrame 提供的 timestamp
            conductor.performanceStartTime = timestamp;
            conductor.isRunning = true;
            
            // 如果是从暂停恢复，使用保存的时间
            if (conductor.pausedTime > 0) {
                conductor.timeOffset = conductor.pausedTime;
                conductor.pausedTime = 0;
            }
            
            console.log('🎵 Conductor resumed at', conductor.timeOffset.toFixed(2), 's');
            
            // 启动游戏循环
            this.lastFrameTime = timestamp;
            this.gameLoop(timestamp);
        });
        
        console.log('▶️ 游戏恢复中...');
    }
    
    /**
     * 重置游戏
     */
    reset() {
        conductor.reset();
        inputManager.reset();
        noteManager.reset();
        
        if (this.hasMusic) {
            audioManager.stop();
            const chart = audioManager.generateChartFromBPM();
            noteManager.loadChart(chart);
        } else {
            noteManager.generateTestChart();
        }
        
        conductor.start();
        console.log('🔄 游戏重置');
    }
    
    /**
     * 游戏主循环 (使用 requestAnimationFrame)
     * @param {number} timestamp - 当前时间戳
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // 计算帧时间差
        this.deltaTime = (timestamp - this.lastFrameTime) / 1000; // 转换为秒
        this.lastFrameTime = timestamp;
        
        // 更新逻辑
        this.update(timestamp);
        
        // 渲染
        this.render();
        
        // 继续下一帧
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    /**
     * 更新游戏逻辑
     * @param {number} timestamp
     */
    update(timestamp) {
        // 更新 Conductor 时间
        conductor.update(timestamp);
        
        // 如果有音乐，同步音乐时间
        if (this.hasMusic && audioManager.isPlaying) {
            const audioTime = audioManager.getCurrentTime();
            // 可以在这里做精确的时间同步
        }
        
        // 更新音符系统
        const currentTime = conductor.getCurrentTime();
        noteManager.update(currentTime, this.deltaTime);
        
        // 检查音乐是否结束
        if (this.hasMusic && audioManager.isEnded()) {
            this.onGameEnd();
        }
        
        // 计算 FPS（每秒更新一次）
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / this.deltaTime);
        }
    }
    
    /**
     * 游戏结束
     */
    onGameEnd() {
        this.pause();
        const stats = noteManager.getStats();
        console.log('🎮 游戏结束！');
        console.log('📊 最终统计:', stats);
        
        // 显示结算界面（后续可添加）
        alert(`游戏结束！\n\n最终得分: ${stats.score}\n最大连击: ${stats.maxCombo}\n准确率: ${stats.accuracy}%`);
    }
    
    /**
     * 渲染游戏画面
     */
    render() {
        // 更新时间显示
        if (this.timeDisplay) {
            const currentTime = conductor.getFormattedTime();
            this.timeDisplay.textContent = `Current Time: ${currentTime}s`;
        }
        
        // 更新分数和连击显示
        const stats = noteManager.getStats();
        
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `分数: ${stats.score}`;
        }
        
        if (this.comboDisplay) {
            if (stats.combo > 0) {
                this.comboDisplay.textContent = `${stats.combo} COMBO`;
                this.comboDisplay.style.display = 'block';
            } else {
                this.comboDisplay.style.display = 'none';
            }
        }
    }
    
    /**
     * 处理轨道点击事件
     * @param {number} trackIndex - 轨道索引 (0-3)
     */
    handleTrackHit(trackIndex) {
        const currentTime = conductor.getCurrentTime();
        
        // 判定音符
        const judgment = noteManager.hit(trackIndex, currentTime);
        
        if (judgment) {
            console.log(`🎯 轨道 ${trackIndex} | 判定: ${judgment} | 连击: ${noteManager.combo}`);
        }
    }
    
    /**
     * 获取当前游戏状态
     * @returns {Object}
     */
    getGameState() {
        return {
            isRunning: this.isRunning,
            currentTime: conductor.getCurrentTime(),
            currentBeat: conductor.getCurrentBeat(),
            bpm: conductor.getBPM(),
            fps: this.fps,
            activeTracks: inputManager.getActiveTracks()
        };
    }
}

// 创建并启动游戏实例
let game;

// 确保在 DOM 加载后创建游戏实例
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new Game();
    });
} else {
    game = new Game();
}

// 暴露到全局作用域（方便调试）
window.game = game;
window.conductor = conductor;
window.inputManager = inputManager;
window.noteManager = noteManager;
window.audioManager = audioManager;

// 添加一些便捷的调试命令
console.log('');
console.log('🎮 ===== 指尖跳动 (Finger Flow) =====');
console.log('💡 调试命令:');
console.log('   game.pause() - 暂停游戏');
console.log('   game.resume() - 继续游戏');
console.log('   game.reset() - 重置游戏');
console.log('   game.getGameState() - 获取游戏状态');
console.log('   noteManager.getStats() - 查看统计数据');
console.log('   audioManager.setVolume(0.5) - 设置音量');
console.log('   conductor.setBPM(176) - 设置BPM');
console.log('=====================================');
console.log('');
