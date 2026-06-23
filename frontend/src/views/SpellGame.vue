<template>
  <div class="spell-wrapper">
    <div class="spell-game">
      <div class="header-nav">
        <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      </div>

      <h1 class="page-title">⌨️ 字母拼写与错题攻坚</h1>

      <div class="layout-main" v-if="currentWord">
        <div class="content-left">
          
          <div class="error-modal" v-if="showErrorModal">
            <div class="error-banner">
              💥 匹配错误，请完成拼写复习
            </div>
            
            <div class="modal-body">
              <div v-if="revealed" class="revealed-word">
                {{ currentWord.word }}
              </div>
              <div v-else class="hint-text">听音拼写正确的单词</div>

              <div class="phonetic-row">
                <span class="phonetic">[{{ currentWord.phonetic0 || currentWord.phonetic1 || '---' }}]</span>
                <button @click="playSound" class="play-btn">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </button>
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

              <div v-if="revealed" class="details-section">
                <div class="section-title">中文释义</div>
                <div class="meaning-text">{{ currentWord.trans?.[0]?.cn || '未知释义' }}</div>
                
                <div class="prompt-text">已记入错题本！按空格键继续：</div>
                <button class="btn-green-outline" @click="nextWord">
                  Space <br/> 继续游戏
                </button>
              </div>
              <div v-else>
                <div class="hint-subtext">拼写正确后自动显示解析</div>
                <div class="reveal-link" @click="revealAnswer">想不起来？直接查看答案 💡</div>
              </div>
            </div>
          </div>
          
          <div v-else class="normal-card">
            <h2 style="color: #2c3e50; text-align: center;">请听音拼写</h2>
            <!-- similar to the modal but standard -->
             <div class="phonetic-row" style="margin: 30px 0;">
                <span class="phonetic" style="font-size: 24px;">[{{ currentWord.phonetic0 || currentWord.phonetic1 || '---' }}]</span>
                <button @click="playSound" class="play-btn" style="width: 60px; height: 60px;">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </button>
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
          </div>

        </div>

        <div class="content-right">
          <div class="queue-panel">
            <div class="queue-title">📝 当前学习队列</div>
            <ul class="queue-list">
              <li 
                v-for="(w, idx) in words" 
                :key="idx"
                :class="{ 'active': idx === currentIndex }"
              >
                <span class="q-idx">{{ idx + 1 }}.</span> {{ w.word.charAt(0) }}***
                <span class="q-icon">{{ idx === currentIndex ? '👉' : '⏳' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="loading">
        <h2>🎉 本组拼写完成！</h2>
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
      playSound();
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
  if (!currentWord.value || !userInput.value.trim()) return;
  const target = currentWord.value.word.toLowerCase();
  const input = userInput.value.trim().toLowerCase();

  if (target === input) {
    // 正确
    dictStore.recordWord(target, !showErrorModal.value);
    if (!revealed.value && showErrorModal.value) {
      revealed.value = true;
    } else {
      nextWord();
    }
  } else {
    // 错误，展示错误 Modal
    showErrorModal.value = true;
    isShake.value = true;
    userInput.value = '';
    setTimeout(() => isShake.value = false, 400);
    setTimeout(() => inputRef.value?.focus(), 500);
  }
};

const revealAnswer = () => {
  revealed.value = true;
  userInput.value = '';
  dictStore.recordWord(currentWord.value!.word, false);
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
.spell-wrapper {
  background: #f8f9fc;
  min-height: 100vh;
  padding: 20px 10px;
}
.spell-game {
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
.content-left {
  flex: 1;
}
.content-right {
  width: 280px;
}

.normal-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
}

/* Modal styles mimicking the screenshots */
.error-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  text-align: center;
}
.error-banner {
  background: linear-gradient(to right, #ff416c, #ff4b2b);
  color: white;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
}
.modal-body {
  padding: 40px;
}
.hint-text {
  color: #7f8c8d;
  font-size: 16px;
  margin-bottom: 20px;
}
.revealed-word {
  font-size: 48px;
  font-weight: bold;
  color: #5B4B8A;
  margin-bottom: 10px;
}
.phonetic-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}
.phonetic {
  font-size: 24px;
  color: #34495e;
}
.play-btn {
  background: #a29bfe;
  border: none;
  width: 45px;
  height: 45px;
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

.details-section {
  text-align: left;
  border-top: 1px dashed #eee;
  padding-top: 20px;
  margin-top: 30px;
}
.section-title {
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 10px;
  font-weight: bold;
}
.meaning-text {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.6;
}
.prompt-text {
  text-align: center;
  color: #95a5a6;
  font-size: 14px;
  margin-bottom: 15px;
  border-top: 1px dashed #eee;
  padding-top: 20px;
}
.btn-green-outline {
  display: block;
  margin: 0 auto;
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

.hint-subtext {
  color: #bdc3c7;
  font-size: 14px;
  margin-top: 20px;
}
.reveal-link {
  color: #e74c3c;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
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
.btn-green {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

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
