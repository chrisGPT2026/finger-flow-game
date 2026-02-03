/**
 * Note - 音符系统
 * 包含音符类和音符管理器
 */

// 判定时间窗口（秒）
const JUDGMENT_WINDOWS = {
    PERFECT: 0.050,  // ±50ms
    GREAT: 0.100,    // ±100ms
    GOOD: 0.150,     // ±150ms
    MISS: 0.200      // ±200ms
};

// 判定分数
const JUDGMENT_SCORES = {
    PERFECT: 100,
    GREAT: 80,
    GOOD: 50,
    MISS: 0
};

/**
 * 音符类
 */
class Note {
    constructor(track, hitTime) {
        this.track = track;           // 轨道索引 (0-3)
        this.hitTime = hitTime;       // 应该被击中的时间（秒）
        this.isHit = false;           // 是否已被击中
        this.isMissed = false;        // 是否已错过
        this.element = null;          // DOM 元素
        this.fallSpeed = 400;         // 下落速度（像素/秒）- 已调慢到原来的一半
        
        this.createElement();
    }
    
    /**
     * 创建音符的 DOM 元素
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'note';
        this.element.dataset.track = this.track;
        
        // 添加音符内部发光效果
        const glow = document.createElement('div');
        glow.className = 'note-glow';
        this.element.appendChild(glow);
        
        // 添加到对应的轨道
        const trackElement = document.querySelector(`.track[data-track="${this.track}"]`);
        if (trackElement) {
            trackElement.appendChild(this.element);
        }
    }
    
    /**
     * 更新音符位置
     * @param {number} currentTime - 当前游戏时间
     * @param {number} deltaTime - 帧时间差
     */
    update(currentTime, deltaTime) {
        if (this.isHit || this.isMissed) return;
        
        // 计算距离判定线的时间差
        const timeDiff = this.hitTime - currentTime;
        
        // 如果音符已经过了 Miss 窗口，标记为错过
        if (timeDiff < -JUDGMENT_WINDOWS.MISS) {
            this.miss();
            return;
        }
        
        // 计算音符位置（从上往下掉落）
        // timeDiff > 0 表示音符还未到达判定线
        const position = timeDiff * this.fallSpeed;
        
        // 更新 DOM 位置（从底部往上计算）
        if (this.element) {
            // 判定线在底部约 130px 的位置
            const judgmentLineY = 130;
            this.element.style.bottom = `${judgmentLineY + position}px`;
            
            // 接近判定线时改变颜色
            if (Math.abs(timeDiff) < JUDGMENT_WINDOWS.GREAT) {
                this.element.classList.add('near-judgment');
            }
        }
    }
    
    /**
     * 判定音符击中
     * @param {number} currentTime - 当前游戏时间
     * @returns {string|null} - 判定结果 (PERFECT/GREAT/GOOD/null)
     */
    judge(currentTime) {
        if (this.isHit || this.isMissed) return null;
        
        const timeDiff = Math.abs(this.hitTime - currentTime);
        let judgment = null;
        
        if (timeDiff <= JUDGMENT_WINDOWS.PERFECT) {
            judgment = 'PERFECT';
        } else if (timeDiff <= JUDGMENT_WINDOWS.GREAT) {
            judgment = 'GREAT';
        } else if (timeDiff <= JUDGMENT_WINDOWS.GOOD) {
            judgment = 'GOOD';
        } else if (timeDiff <= JUDGMENT_WINDOWS.MISS) {
            judgment = 'MISS';
        }
        
        if (judgment) {
            this.hit(judgment);
        }
        
        return judgment;
    }
    
    /**
     * 标记音符为已击中
     * @param {string} judgment - 判定结果
     */
    hit(judgment) {
        this.isHit = true;
        
        if (this.element) {
            this.element.classList.add('hit', judgment.toLowerCase());
            
            // 动画结束后移除元素
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 300);
        }
    }
    
    /**
     * 标记音符为已错过
     */
    miss() {
        this.isMissed = true;
        
        if (this.element) {
            this.element.classList.add('missed');
            
            // 淡出后移除
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 300);
        }
    }
    
    /**
     * 销毁音符
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

/**
 * 音符管理器
 */
class NoteManager {
    constructor() {
        this.notes = [];              // 所有音符
        this.activeNotes = [];        // 活跃的音符（未击中/未错过）
        this.chart = [];              // 谱面数据
        this.chartIndex = 0;          // 当前谱面索引
        
        // 统计数据
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.judgmentCounts = {
            PERFECT: 0,
            GREAT: 0,
            GOOD: 0,
            MISS: 0
        };
        
        // 预生成时间（提前多久生成音符）
        this.spawnTime = 2.0; // 2秒
    }
    
    /**
     * 加载谱面
     * @param {Array} chart - 谱面数据 [{track, time}, ...]
     */
    loadChart(chart) {
        this.chart = chart.sort((a, b) => a.time - b.time);
        this.chartIndex = 0;
        console.log(`📝 谱面加载完成: ${chart.length} 个音符`);
    }
    
    /**
     * 生成测试谱面
     */
    generateTestChart() {
        const testChart = [];
        const startTime = 3.0; // 3秒后开始（给更多准备时间）
        const interval = 1.0;  // 每1秒一个音符（降低密度）
        const duration = 30;   // 30秒的谱面
        
        for (let time = startTime; time < startTime + duration; time += interval) {
            // 随机选择轨道
            const track = Math.floor(Math.random() * 4);
            testChart.push({ track, time });
            
            // 偶尔生成双押
            if (Math.random() > 0.7) {
                let track2 = Math.floor(Math.random() * 4);
                // 确保不是同一轨道
                while (track2 === track) {
                    track2 = Math.floor(Math.random() * 4);
                }
                testChart.push({ track: track2, time });
            }
        }
        
        this.loadChart(testChart);
    }
    
    /**
     * 更新音符管理器
     * @param {number} currentTime - 当前游戏时间
     * @param {number} deltaTime - 帧时间差
     */
    update(currentTime, deltaTime) {
        // 生成新音符
        this.spawnNotes(currentTime);
        
        // 更新所有活跃音符
        this.activeNotes.forEach(note => {
            note.update(currentTime, deltaTime);
        });
        
        // 清理已击中或错过的音符
        this.activeNotes = this.activeNotes.filter(note => !note.isHit && !note.isMissed);
        
        // 检查是否有自动 Miss 的音符
        this.checkAutoMiss(currentTime);
    }
    
    /**
     * 生成音符
     * @param {number} currentTime - 当前游戏时间
     */
    spawnNotes(currentTime) {
        while (this.chartIndex < this.chart.length) {
            const noteData = this.chart[this.chartIndex];
            
            // 如果音符应该在未来 spawnTime 秒内出现，就生成它
            if (noteData.time <= currentTime + this.spawnTime) {
                const note = new Note(noteData.track, noteData.time);
                this.notes.push(note);
                this.activeNotes.push(note);
                this.chartIndex++;
            } else {
                break;
            }
        }
    }
    
    /**
     * 检查自动 Miss
     * @param {number} currentTime - 当前游戏时间
     */
    checkAutoMiss(currentTime) {
        this.activeNotes.forEach(note => {
            if (!note.isHit && !note.isMissed) {
                const timeDiff = currentTime - note.hitTime;
                if (timeDiff > JUDGMENT_WINDOWS.MISS) {
                    note.miss();
                    this.addJudgment('MISS');
                }
            }
        });
    }
    
    /**
     * 处理玩家击打
     * @param {number} track - 轨道索引
     * @param {number} currentTime - 当前游戏时间
     * @returns {string|null} - 判定结果
     */
    hit(track, currentTime) {
        // 找到该轨道上最接近判定线的未击中音符
        let closestNote = null;
        let minTimeDiff = Infinity;
        
        this.activeNotes.forEach(note => {
            if (note.track === track && !note.isHit && !note.isMissed) {
                const timeDiff = Math.abs(note.hitTime - currentTime);
                if (timeDiff < minTimeDiff && timeDiff <= JUDGMENT_WINDOWS.MISS) {
                    minTimeDiff = timeDiff;
                    closestNote = note;
                }
            }
        });
        
        if (closestNote) {
            const judgment = closestNote.judge(currentTime);
            if (judgment) {
                this.addJudgment(judgment);
                return judgment;
            }
        }
        
        return null;
    }
    
    /**
     * 添加判定结果
     * @param {string} judgment - 判定结果
     */
    addJudgment(judgment) {
        this.judgmentCounts[judgment]++;
        
        // 更新分数
        this.score += JUDGMENT_SCORES[judgment];
        
        // 更新连击
        if (judgment === 'MISS') {
            this.combo = 0;
        } else {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        }
        
        // 显示判定文字
        this.showJudgmentText(judgment);
    }
    
    /**
     * 显示判定文字
     * @param {string} judgment - 判定结果
     */
    showJudgmentText(judgment) {
        const judgmentDisplay = document.getElementById('judgment-display');
        if (judgmentDisplay) {
            judgmentDisplay.textContent = judgment;
            judgmentDisplay.className = 'judgment-text ' + judgment.toLowerCase();
            
            // 触发动画（移除后重新添加类）
            judgmentDisplay.style.animation = 'none';
            setTimeout(() => {
                judgmentDisplay.style.animation = '';
            }, 10);
        }
    }
    
    /**
     * 重置音符管理器
     */
    reset() {
        // 清理所有音符
        this.activeNotes.forEach(note => note.destroy());
        this.notes = [];
        this.activeNotes = [];
        this.chartIndex = 0;
        
        // 重置统计
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.judgmentCounts = {
            PERFECT: 0,
            GREAT: 0,
            GOOD: 0,
            MISS: 0
        };
        
        console.log('🔄 音符管理器已重置');
    }
    
    /**
     * 获取统计数据
     * @returns {Object}
     */
    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            judgmentCounts: { ...this.judgmentCounts },
            totalNotes: this.chart.length,
            hitNotes: this.judgmentCounts.PERFECT + this.judgmentCounts.GREAT + this.judgmentCounts.GOOD,
            accuracy: this.calculateAccuracy()
        };
    }
    
    /**
     * 计算准确率
     * @returns {number}
     */
    calculateAccuracy() {
        const total = Object.values(this.judgmentCounts).reduce((a, b) => a + b, 0);
        if (total === 0) return 100;
        
        const weighted = 
            this.judgmentCounts.PERFECT * 100 +
            this.judgmentCounts.GREAT * 80 +
            this.judgmentCounts.GOOD * 50;
        
        return (weighted / (total * 100) * 100).toFixed(2);
    }
}

// 创建全局实例
const noteManager = new NoteManager();
