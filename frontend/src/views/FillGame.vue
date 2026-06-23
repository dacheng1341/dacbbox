<template>
  <div class="fill-wrapper">
    <div class="fill-game">
      <div class="header-nav">
        <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      </div>

      <h1 class="page-title">📝 看意猜词填空</h1>

      <div class="layout-main" v-if="currentWord">
        <div class="content-left">
          <div class="normal-card">
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">根据中文释义拼写单词</h2>
            
            <div class="details-section" style="margin-bottom: 40px;">
              <div class="section-title">中文释义</div>
              <div class="meaning-text" style="font-size: 24px; text-align: center; color: #e67e22; font-weight: bold;">
                {{ currentWord.trans?.[0]?.cn || '未知释义' }}
              </div>
            </div>

            <div class="input-container">
              <input 
                type="text" 
                v-model="userInput" 
                @keyup.enter="checkSpell" 
                class="spell-input" 
                :class="{'shake-error': isShake}"
                placeholder="输入单词..." 
                autocomplete="off"
                ref="inputRef"
              />
            </div>
            
            <div class="action-row" style="text-align: center; margin-top: 30px;">
              <button class="btn-green-outline" @click="checkSpell" style="display: inline-block;">
                提交答案
              </button>
            </div>

            <!-- 错误反馈区域 -->
            <div v-if="showErrorModal" style="margin-top: 30px; text-align: center;">
              <div style="color: #e74c3c; font-weight: bold; margin-bottom: 10px;">💥 拼写错误，再试一次！</div>
            </div>

            <div v-if="revealed" class="details-section" style="margin-top: 40px; background: #f8f9fa; padding: 20px; border-radius: 12px;">
              <div class="section-title">正确答案</div>
              <div class="phonetic-row" style="margin: 20px 0;">
                <span class="revealed-word">{{ currentWord.word }}</span>
                <span class="phonetic" style="margin: 0 15px;">[{{ currentWord.phonetic0 || currentWord.phonetic1 || '---' }}]</span>
                <button @click="playSound" class="play-btn" style="width: 40px; height: 40px;">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </button>
              </div>
              
              <div class="prompt-text">已记入错题本！按空格键继续：</div>
              <button class="btn-green" @click="nextWord" style="margin: 0 auto; display: block;">
                Space 继续游戏
              </button>
            </div>
            
            <div v-if="!revealed" style="text-align: center; margin-top: 30px;">
              <span class="reveal-link" @click="revealAnswer">想不起来？直接查看答案 💡</span>
            </div>
          </div>
        </div>

        <div class="content-right">
          <div class="queue-panel">
            <div class="queue-title">📝 当前学习队列</div>
            <ul class="queue-list">
              <li 
                v-for="(_w, idx) in words" 
                :key="idx"
                :class="{ 'active': idx === currentIndex }"
              >
                <span class="q-idx">{{ idx + 1 }}.</span>
                <span class="q-icon">{{ idx === currentIndex ? '👉' : '⏳' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="loading">
        <h2>🎉 本组填空完成！</h2>
        <button @click="startRound" class="btn-green" style="margin-top: 20px;">继续下一组</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import type { Word } from '../store/gameDict';
import { useDictStore } from '../store/gameDict';
import { playAudio } from '../utils/audio';

const dictStore = useDictStore();

const words = ref<Word[]>([]);
const currentIndex = ref(0);
const currentWord = computed(() => words.value[currentIndex.value]);

const userInput = ref('');
const isShake = ref(false);
const showErrorModal = ref(false);
const revealed = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const startRound = () => {
  words.value = dictStore.getRandomWords(5);
  currentIndex.value = 0;
  resetState();
};

const resetState = () => {
  userInput.value = '';
  isShake.value = false;
  showErrorModal.value = false;
  revealed.value = false;
  if (words.value.length > 0) {
    setTimeout(() => {
      inputRef.value?.focus();
    }, 300);
  }
};

const playSound = () => {
  if (currentWord.value) {
    playAudio(currentWord.value.word);
  }
};

const checkSpell = () => {
  if (revealed.value) return; // 如果已经偷看了答案，只能按空格下一题
  if (!currentWord.value || !userInput.value.trim()) return;
  const target = currentWord.value.word.toLowerCase();
  const input = userInput.value.trim().toLowerCase();

  if (target === input) {
    dictStore.recordWord(target, true);
    playSound(); // 答对播放奖励音
    setTimeout(() => {
      nextWord();
    }, 500);
  } else {
    showErrorModal.value = true;
    isShake.value = true;
    setTimeout(() => isShake.value = false, 400);
    setTimeout(() => inputRef.value?.focus(), 500);
  }
};

const revealAnswer = () => {
  revealed.value = true;
  showErrorModal.value = false;
  userInput.value = '';
  dictStore.recordWord(currentWord.value!.word, false);
  playSound();
};

const nextWord = () => {
  currentIndex.value++;
  resetState();
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && revealed.value) {
    e.preventDefault();
    nextWord();
  }
};

onMounted(() => {
  if(dictStore.words.length > 0) {
    startRound();
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.fill-wrapper {
  background: #f8f9fc;
  min-height: 100vh;
  padding: 20px 10px;
}
.fill-game {
  max-width: 1000px;
  margin: 0 auto;
}
.header-nav { margin-bottom: 20px; }
.back-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.page-title {
  text-align: center;
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
}
.layout-main {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}
.content-left { flex: 1; }
.content-right { width: 280px; }

.normal-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
}

.details-section {
  text-align: left;
}
.section-title {
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 10px;
  font-weight: bold;
  text-align: center;
}

.input-container {
  margin: 0 auto;
  max-width: 400px;
}
.spell-input {
  width: 100%;
  padding: 20px;
  font-size: 28px;
  text-align: center;
  border: 2px dashed #bdc3c7;
  border-radius: 12px;
  outline: none;
  transition: 0.3s;
  box-sizing: border-box;
}
.spell-input:focus {
  border-color: #a29bfe;
  background: #f8f7ff;
}
.shake-error {
  animation: shake 0.4s;
  border-color: #ff4757 !important;
  background: #fff0f1 !important;
}

.phonetic-row {
  display: flex;
  align-items: center;
  justify-content: center;
}
.revealed-word {
  font-size: 32px;
  font-weight: bold;
  color: #5B4B8A;
}
.phonetic {
  font-size: 20px;
  color: #34495e;
}
.play-btn {
  background: #a29bfe;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 10px rgba(162, 155, 254, 0.4);
}
.play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 15px rgba(162, 155, 254, 0.6);
}

.prompt-text {
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  margin-bottom: 15px;
}
.btn-green-outline {
  background: white;
  border: 2px solid #2ecc71;
  color: #2ecc71;
  border-radius: 12px;
  padding: 10px 40px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-green-outline:hover {
  background: #2ecc71;
  color: white;
}
.btn-green {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.reveal-link {
  color: #e74c3c;
  font-weight: bold;
  cursor: pointer;
}

/* Queue Panel */
.queue-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.queue-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.queue-list { list-style: none; padding: 0; margin: 0; }
.queue-list li {
  padding: 12px 10px;
  border-radius: 8px;
  margin-bottom: 5px;
  color: #7f8c8d;
  display: flex;
  align-items: center;
}
.queue-list li.active {
  background: #f0f4f8;
  color: #3498db;
  font-weight: bold;
}
.q-idx { margin-right: 10px; }
.q-icon { margin-left: auto; }

.loading { text-align: center; padding: 50px; }

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  50% { transform: translateX(8px); }
  75% { transform: translateX(-8px); }
  100% { transform: translateX(0); }
}

@media (max-width: 768px) {
  .layout-main { flex-direction: column; }
  .content-right { width: 100%; }
}
</style>
