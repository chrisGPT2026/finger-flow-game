/**
 * Audio Manager - 音频管理器
 * 处理音乐播放、加载和同步
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.sourceNode = null;
        this.gainNode = null;
        
        this.isLoaded = false;
        this.isPlaying = false;
        this.audioStartTime = 0;
        
        // 音乐信息
        this.musicInfo = {
            title: "District Four",
            artist: "Kevin MacLeod",
            bpm: 176, // 176 bpm - 快节奏电子音乐
            duration: 248, // 4:08 = 248秒
            offset: 0, // 音频偏移（用于精确同步）
            source: "incompetech.com", // 来源
            genre: "Electronic/Funk" // 风格
        };
        
        // 默认音乐文件路径
        this.defaultMusicPath = 'music/district-four.mp3';
    }
    
    /**
     * 尝试自动加载默认音乐
     * @returns {Promise<boolean>}
     */
    async tryAutoLoadMusic() {
        try {
            const success = await this.loadMusic(this.defaultMusicPath);
            if (success) {
                console.log('✅ 自动加载音乐成功');
                return true;
            }
        } catch (error) {
            console.log('ℹ️ 未找到默认音乐文件，请手动加载');
        }
        return false;
    }
    
    /**
     * 初始化音频系统
     */
    async init() {
        try {
            // 创建 AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建 audio 元素
            this.audioElement = document.getElementById('game-audio');
            if (!this.audioElement) {
                console.warn('⚠️ 未找到音频元素，请先加载音乐文件');
                return false;
            }
            
            // 创建增益节点（用于控制音量）
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            
            // 连接音频源
            if (!this.sourceNode) {
                this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
                this.sourceNode.connect(this.gainNode);
            }
            
            console.log('🎵 音频系统初始化成功');
            return true;
        } catch (error) {
            console.error('❌ 音频系统初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 加载音乐文件
     * @param {string} url - 音乐文件 URL
     */
    async loadMusic(url) {
        if (!this.audioElement) {
            console.error('❌ 音频元素未初始化');
            return false;
        }
        
        return new Promise((resolve, reject) => {
            this.audioElement.src = url;
            
            this.audioElement.addEventListener('canplaythrough', () => {
                this.isLoaded = true;
                this.musicInfo.duration = this.audioElement.duration;
                console.log(`✅ 音乐加载完成: ${this.musicInfo.title}`);
                console.log(`📊 时长: ${this.formatTime(this.musicInfo.duration)}`);
                console.log(`🎼 BPM: ${this.musicInfo.bpm}`);
                resolve(true);
            }, { once: true });
            
            this.audioElement.addEventListener('error', (e) => {
                console.error('❌ 音乐加载失败:', e);
                reject(false);
            }, { once: true });
            
            // 预加载
            this.audioElement.load();
        });
    }
    
    /**
     * 播放音乐
     */
    async play() {
        if (!this.isLoaded) {
            console.warn('⚠️ 音乐未加载');
            return false;
        }
        
        try {
            // 恢复 AudioContext（某些浏览器需要用户交互）
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audioElement.play();
            this.isPlaying = true;
            this.audioStartTime = this.audioContext.currentTime - this.audioElement.currentTime;
            
            console.log('▶️ 音乐开始播放');
            return true;
        } catch (error) {
            console.error('❌ 播放失败:', error);
            return false;
        }
    }
    
    /**
     * 暂停音乐
     */
    pause() {
        if (this.audioElement && this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            console.log('⏸️ 音乐已暂停');
        }
    }
    
    /**
     * 停止音乐
     */
    stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
            console.log('⏹️ 音乐已停止');
        }
    }
    
    /**
     * 跳转到指定时间
     * @param {number} time - 时间（秒）
     */
    seekTo(time) {
        if (this.audioElement) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration));
        }
    }
    
    /**
     * 获取当前播放时间
     * @returns {number}
     */
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }
    
    /**
     * 设置音量
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
        if (this.audioElement) {
            this.audioElement.volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    /**
     * 获取音乐信息
     * @returns {Object}
     */
    getMusicInfo() {
        return { ...this.musicInfo };
    }
    
    /**
     * 根据 BPM 生成谱面
     * @returns {Array} 谱面数据
     */
    generateChartFromBPM() {
        const chart = [];
        const { bpm, duration } = this.musicInfo;
        
        // 计算每拍的时长
        const beatDuration = 60 / bpm;
        
        // 从第一个小节开始（给 2 秒准备时间）
        const startTime = 2.0;
        const endTime = duration - 1.0; // 结束前 1 秒停止生成
        
        // 生成音符
        for (let time = startTime; time < endTime; time += beatDuration) {
            // 根据节拍强弱决定音符密度
            const beatInMeasure = Math.floor((time - startTime) / beatDuration) % 4;
            
            if (beatInMeasure === 0) {
                // 强拍 - 可能生成 1-2 个音符
                const track = Math.floor(Math.random() * 4);
                chart.push({ track, time });
                
                // 30% 概率双押
                if (Math.random() > 0.7) {
                    let track2 = Math.floor(Math.random() * 4);
                    while (track2 === track) {
                        track2 = Math.floor(Math.random() * 4);
                    }
                    chart.push({ track: track2, time });
                }
            } else if (beatInMeasure === 2) {
                // 次强拍 - 生成单音符
                const track = Math.floor(Math.random() * 4);
                chart.push({ track, time });
            }
            // 弱拍有 40% 概率生成音符
            else if (Math.random() > 0.6) {
                const track = Math.floor(Math.random() * 4);
                chart.push({ track, time });
            }
        }
        
        console.log(`📝 根据 BPM ${bpm} 生成谱面: ${chart.length} 个音符`);
        return chart;
    }
    
    /**
     * 格式化时间显示
     * @param {number} seconds
     * @returns {string}
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * 检查音频是否已结束
     * @returns {boolean}
     */
    isEnded() {
        return this.audioElement ? this.audioElement.ended : false;
    }
}

// 创建全局实例
const audioManager = new AudioManager();
