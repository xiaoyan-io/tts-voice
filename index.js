
        // ============ 历史记录管理功能 ============

        // 获取历史记录
        function getHistory() {
            const historyJson = localStorage.getItem('tts_voice_history_v1');
            return historyJson ? JSON.parse(historyJson) : [];
        }

        // 保存历史记录
        function saveToHistory(record) {
            try {
                let history = getHistory();
                
                // 将音频Blob转为Base64
                const reader = new FileReader();
                reader.onload = function(e) {
                    const audioBase64 = e.target.result;
                    
                    // 构建历史记录对象（不保存完整文本，只保留预览）
                    const historyItem = {
                        id: Date.now(),
                        textPreview: record.text.substring(0, 100),
                        fullText: record.text,
                        voice: record.voice,
                        voiceName: getVoiceName(record.voice),
                        speed: record.speed,
                        pitch: record.pitch,
                        style: record.style,
                        audioBase64: audioBase64,
                        timestamp: record.timestamp
                    };
                    
                    // 添加到历史记录数组顶部
                    history.unshift(historyItem);
                    
                    // 只保留最多20条记录
                    if (history.length > 20) {
                        history = history.slice(0, 20);
                    }
                    
                    // 保存到localStorage
                    localStorage.setItem('tts_voice_history_v1', JSON.stringify(history));
                    
                    // 刷新历史记录显示
                    renderHistory();
                };
                reader.readAsDataURL(record.audioBlob);
            } catch (error) {
                console.error('保存历史记录失败:', error);
            }
        }

        // 获取音色名称
        function getVoiceName(voiceValue) {
            const voiceMap = {
                'my-MM-NilarNeural': '缅甸语 - 女声 (Nilar)',
                'my-MM-ThihaNeural': '缅甸语 - 男声 (Thiha)',
                'zh-CN-XiaoxiaoNeural': '晓晓 (女声·温柔)',
                'zh-CN-YunxiNeural': '云希 (男声·清朗)',
                'zh-CN-YunyangNeural': '云扬 (男声·阳光)',
                'zh-CN-XiaoyiNeural': '晓伊 (女声·甜美)',
                'zh-CN-YunjianNeural': '云健 (男声·稳重)',
                'zh-CN-XiaochenNeural': '晓辰 (女声·知性)',
                'zh-CN-XiaohanNeural': '晓涵 (女声·优雅)',
                'zh-CN-XiaomengNeural': '晓梦 (女声·梦幻)',
                'zh-CN-XiaomoNeural': '晓墨 (女声·文艺)',
                'zh-CN-XiaoqiuNeural': '晓秋 (女声·成熟)',
                'zh-CN-XiaoruiNeural': '晓睿 (女声·智慧)',
                'zh-CN-XiaoshuangNeural': '晓双 (女声·活泼)',
                'zh-CN-XiaoxuanNeural': '晓萱 (女声·清新)',
                'zh-CN-XiaoyanNeural': '晓颜 (女声·柔美)',
                'zh-CN-XiaoyouNeural': '晓悠 (女声·悠扬)',
                'zh-CN-XiaozhenNeural': '晓甄 (女声·端庄)',
                'zh-CN-YunfengNeural': '云枫 (男声·磁性)',
                'zh-CN-YunhaoNeural': '云皓 (男声·豪迈)',
                'zh-CN-YunxiaNeural': '云夏 (男声·热情)',
                'zh-CN-YunyeNeural': '云野 (男声·野性)',
                'zh-CN-YunzeNeural': '云泽 (男声·深沉)'
            };
            return voiceMap[voiceValue] || voiceValue;
        }

        // 获取风格名称
        function getStyleName(styleValue) {
            const styleMap = {
                'general': '🎭 通用风格',
                'assistant': '🤖 智能助手',
                'chat': '💬 聊天对话',
                'customerservice': '📞 客服专业',
                'newscast': '📺 新闻播报',
                'affectionate': '💕 亲切温暖',
                'calm': '😌 平静舒缓',
                'cheerful': '😊 愉快欢乐',
                'gentle': '🌸 温和柔美',
                'lyrical': '🎼 抒情诗意',
                'serious': '🎯 严肃正式'
            };
            return styleMap[styleValue] || styleValue;
        }

        // 获取语速名称
        function getSpeedName(speedValue) {
            const speedMap = {
                '0.5': '🐌 很慢',
                '0.75': '🚶 慢速',
                '1.0': '⚡ 正常',
                '1.25': '🏃 快速',
                '1.5': '🚀 很快',
                '2.0': '💨 极速'
            };
            return speedMap[speedValue] || speedValue;
        }

        // 获取音调名称
        function getPitchName(pitchValue) {
            const pitchMap = {
                '-50': '📉 很低沉',
                '-25': '📊 低沉',
                '0': '🎵 标准',
                '25': '📈 高亢',
                '50': '🎶 很高亢'
            };
            return pitchMap[pitchValue] || pitchValue;
        }

        // 渲染历史记录列表
        function renderHistory() {
            const historyList = document.getElementById('historyList');
            const history = getHistory();
            
            if (!history || history.length === 0) {
                historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin: 20px 0;">暂无历史记录</p>';
                return;
            }
            
            let html = '';
            history.forEach((item, index) => {
                const speedName = getSpeedName(item.speed);
                const pitchName = getPitchName(item.pitch);
                const styleName = getStyleName(item.style);
                
                html += `
                    <div class="history-item" data-id="${item.id}">
                        <div class="history-item-content">
                            <div class="history-item-text" title="${item.fullText}">
                                📝 ${item.textPreview}${item.fullText.length > 100 ? '...' : ''}
                            </div>
                            <div class="history-item-meta">
                                <span class="history-item-meta-tag">🎙️ ${item.voiceName}</span>
                                <span class="history-item-meta-tag">${speedName}</span>
                                <span class="history-item-meta-tag">${pitchName}</span>
                                <span class="history-item-meta-tag">${styleName}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                ⏰ ${item.timestamp}
                            </div>
                            <audio class="history-audio-player" controls style="margin-top: 8px;">
                                <source src="${item.audioBase64}" type="audio/mpeg">
                                您的浏览器不支持音频播放
                            </audio>
                        </div>
                        <div class="history-item-controls">
                            <a href="${item.audioBase64}" download="voicecraft_${item.id}.mp3" class="history-btn history-btn-secondary">
                                <span>📥</span>
                                <span>下载</span>
                            </a>
                            <button type="button" class="history-btn history-btn-primary" onclick="loadFromHistory('${item.id}')">
                                <span>↩️</span>
                                <span>使用</span>
                            </button>
                            <button type="button" class="history-btn history-btn-danger" onclick="deleteHistoryItem('${item.id}')">
                                <span>🗑️</span>
                                <span>删除</span>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            historyList.innerHTML = html;
        }

        // 从历史记录加载（回填到输入框）
        function loadFromHistory(itemId) {
            const history = getHistory();
            const item = history.find(h => h.id === parseInt(itemId));
            
            if (!item) {
                alert('未找到该历史记录');
                return;
            }
            
            // 切换到TTS模式
            switchMode('tts');
            
            // 回填文本、音色和参数
            document.getElementById('text').value = item.fullText;
            document.getElementById('voice').value = item.voice;
            document.getElementById('speed').value = item.speed;
            document.getElementById('pitch').value = item.pitch;
            document.getElementById('style').value = item.style;
            
            // 滚动到表单区域
            document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
            
            // 显示提示信息
            alert('已加载历史记录！配置已回填，现在可以修改或直接生成');
        }

        // 删除单个历史记录
        function deleteHistoryItem(itemId) {
            if (!confirm('确定要删除这条记录吗？')) {
                return;
            }
            
            let history = getHistory();
            history = history.filter(h => h.id !== parseInt(itemId));
            localStorage.setItem('tts_voice_history_v1', JSON.stringify(history));
            renderHistory();
        }

        // 清空所有历史记录
        function clearAllHistory() {
            if (!confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
                return;
            }
            
            localStorage.removeItem('tts_voice_history_v1');
            renderHistory();
        }

        // 清空按钮事件
        document.getElementById('clearHistoryBtn').addEventListener('click', clearAllHistory);

        // 页面加载时初始化历史记录显示
        window.addEventListener('load', function() {
            // 延迟执行，确保DOM已完全加载
            setTimeout(() => {
                renderHistory();
            }, 100);
        });
