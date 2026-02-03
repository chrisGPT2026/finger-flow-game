/**
 * Input - 输入管理器
 * 处理键盘、触摸和鼠标输入事件
 */

class InputManager {
    constructor() {
        this.keyMap = {
            'KeyZ': 0,           // Z 键 - 第1轨道
            'KeyC': 1,           // C 键 - 第2轨道
            'ArrowLeft': 2,      // ← 左箭头 - 第3轨道
            'ArrowRight': 3      // → 右箭头 - 第4轨道
        };
        
        this.trackStates = [false, false, false, false];
        this.judgmentBoxes = [];
        this.activeKeys = new Set();
        
        this.init();
    }
    
    /**
     * 初始化输入监听
     */
    init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }
    
    /**
     * 设置所有事件监听器
     */
    setupEventListeners() {
        // 获取所有判定框
        this.judgmentBoxes = document.querySelectorAll('.judgment-box');
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 为每个判定框添加触摸/鼠标事件
        this.judgmentBoxes.forEach((box, index) => {
            // 鼠标事件
            box.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.activateTrack(index);
            });
            
            box.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.deactivateTrack(index);
            });
            
            box.addEventListener('mouseleave', (e) => {
                this.deactivateTrack(index);
            });
            
            // 触摸事件
            box.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.activateTrack(index);
            });
            
            box.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.deactivateTrack(index);
            });
            
            box.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.deactivateTrack(index);
            });
        });
        
        // 防止页面滚动和缩放
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        console.log('🎮 Input Manager initialized');
    }
    
    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        // 防止重复触发
        if (e.repeat) return;
        
        const trackIndex = this.keyMap[e.code];
        if (trackIndex !== undefined) {
            e.preventDefault();
            this.activateTrack(trackIndex);
            this.activeKeys.add(e.code);
        }
    }
    
    /**
     * 处理键盘释放事件
     * @param {KeyboardEvent} e
     */
    handleKeyUp(e) {
        const trackIndex = this.keyMap[e.code];
        if (trackIndex !== undefined) {
            e.preventDefault();
            this.deactivateTrack(trackIndex);
            this.activeKeys.delete(e.code);
        }
    }
    
    /**
     * 激活指定轨道（触发视觉反馈）
     * @param {number} trackIndex - 轨道索引 (0-3)
     */
    activateTrack(trackIndex) {
        if (trackIndex < 0 || trackIndex > 3) return;
        
        this.trackStates[trackIndex] = true;
        
        // 添加视觉反馈
        if (this.judgmentBoxes[trackIndex]) {
            this.judgmentBoxes[trackIndex].classList.add('active');
        }
        
        // 触发游戏逻辑（可在 main.js 中监听）
        this.onTrackHit(trackIndex);
        
        console.log(`✨ Track ${trackIndex} activated`);
    }
    
    /**
     * 取消激活指定轨道
     * @param {number} trackIndex - 轨道索引 (0-3)
     */
    deactivateTrack(trackIndex) {
        if (trackIndex < 0 || trackIndex > 3) return;
        
        this.trackStates[trackIndex] = false;
        
        // 移除视觉反馈
        if (this.judgmentBoxes[trackIndex]) {
            this.judgmentBoxes[trackIndex].classList.remove('active');
        }
        
        console.log(`💫 Track ${trackIndex} deactivated`);
    }
    
    /**
     * 轨道点击回调（供外部监听）
     * @param {number} trackIndex
     */
    onTrackHit(trackIndex) {
        // 这个方法可以被 main.js 重写，用于处理音符判定
        // 例如: inputManager.onTrackHit = (track) => { ... }
    }
    
    /**
     * 检查某个轨道是否被按下
     * @param {number} trackIndex
     * @returns {boolean}
     */
    isTrackActive(trackIndex) {
        return this.trackStates[trackIndex];
    }
    
    /**
     * 获取所有当前激活的轨道
     * @returns {number[]}
     */
    getActiveTracks() {
        return this.trackStates
            .map((state, index) => state ? index : -1)
            .filter(index => index !== -1);
    }
    
    /**
     * 清除所有输入状态（用于重置）
     */
    reset() {
        this.trackStates = [false, false, false, false];
        this.activeKeys.clear();
        this.judgmentBoxes.forEach(box => {
            box.classList.remove('active');
        });
        console.log('🔄 Input Manager reset');
    }
}

// 创建全局 InputManager 实例
const inputManager = new InputManager();
