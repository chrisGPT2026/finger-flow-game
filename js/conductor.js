/**
 * Conductor - 时间同步和节奏管理器
 * 负责处理游戏时间、BPM计算和音频同步
 */

class Conductor {
    constructor() {
        this.startTime = null;
        this.currentTime = 0;
        this.isRunning = false;
        this.bpm = 120; // 默认BPM
        this.timeOffset = 0;
        
        // 用于高精度计时
        this.performanceStartTime = null;
        
        // 暂停时保存的时间
        this.pausedTime = 0;
    }
    
    /**
     * 初始化并启动计时器
     */
    start() {
        if (this.isRunning) return;
        
        // 如果是从暂停恢复，使用保存的时间
        if (this.pausedTime > 0) {
            this.timeOffset = this.pausedTime;
            this.pausedTime = 0;
        }
        
        this.performanceStartTime = performance.now();
        this.startTime = Date.now();
        this.isRunning = true;
        
        console.log('🎵 Conductor started/resumed at', this.timeOffset.toFixed(2), 's');
    }
    
    /**
     * 暂停计时器
     */
    pause() {
        if (!this.isRunning) return;
        
        // 保存当前时间
        this.pausedTime = this.currentTime;
        this.isRunning = false;
        
        console.log('⏸️ Conductor paused at', this.pausedTime.toFixed(2), 's');
    }
    
    /**
     * 重置计时器
     */
    reset() {
        this.startTime = null;
        this.currentTime = 0;
        this.isRunning = false;
        this.performanceStartTime = null;
        this.timeOffset = 0;
        this.pausedTime = 0;
        console.log('🔄 Conductor reset');
    }
    
    /**
     * 更新当前时间（在游戏主循环中调用）
     * @param {number} timestamp - requestAnimationFrame 提供的时间戳
     */
    update(timestamp) {
        if (!this.isRunning) return;
        
        // 使用 performance.now() 获取高精度时间（毫秒）
        const elapsedMs = timestamp - this.performanceStartTime;
        this.currentTime = (elapsedMs / 1000) + this.timeOffset;
    }
    
    /**
     * 获取当前时间（秒）
     * @returns {number}
     */
    getCurrentTime() {
        return this.currentTime;
    }
    
    /**
     * 获取格式化的时间字符串
     * @returns {string}
     */
    getFormattedTime() {
        return this.currentTime.toFixed(2);
    }
    
    /**
     * 设置BPM
     * @param {number} bpm - 每分钟节拍数
     */
    setBPM(bpm) {
        this.bpm = bpm;
        console.log(`🎼 BPM set to: ${bpm}`);
    }
    
    /**
     * 获取当前BPM
     * @returns {number}
     */
    getBPM() {
        return this.bpm;
    }
    
    /**
     * 计算一个节拍的时长（秒）
     * @returns {number}
     */
    getBeatDuration() {
        return 60 / this.bpm;
    }
    
    /**
     * 获取当前是第几拍
     * @returns {number}
     */
    getCurrentBeat() {
        return Math.floor(this.currentTime / this.getBeatDuration());
    }
    
    /**
     * 设置时间偏移（用于音频同步校准）
     * @param {number} offset - 偏移量（秒）
     */
    setTimeOffset(offset) {
        this.timeOffset = offset;
    }
    
    /**
     * 跳转到指定时间
     * @param {number} time - 目标时间（秒）
     */
    seekTo(time) {
        this.timeOffset = time;
        this.performanceStartTime = performance.now();
        this.currentTime = time;
        console.log(`⏩ Seek to: ${time.toFixed(2)}s`);
    }
}

// 创建全局 Conductor 实例
const conductor = new Conductor();
