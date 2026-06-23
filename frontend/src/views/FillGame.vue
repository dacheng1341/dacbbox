<template>
  <div class="fill-game">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      <div class="stats">
        <span>连对: {{ combo }}</span>
      </div>
    </div>

    <div class="game-area" v-if="currentWord">
      <div class="meaning-box">
        <div class="question">根据意思拼写单词：</div>
        <div class="chinese">{{ currentWord.trans?.[0]?.cn }}</div>
      </div>

      <div class="input-box">
        <input 
          v-model="userInput" 
          @keyup.enter="checkAnswer"
          type="text" 
          autocomplete="off"
          placeholder="在此输入英文单词..."
          class="word-input"
          :class="{ 'error-shake': isError }"
          ref="inputRef"
        />
      </div>

      <div class="actions">
        <button @click="checkAnswer" class="submit-btn">提交答案</button>
      </div>

      <div class="controls">
        <button @click="showHint" class="hint-btn">👀 给个首字母</button>
        <button @click="skipWord" class="skip-btn">⏭️ 不会，跳过</button>
      </div>

      <div class="answer-reveal" v-if="revealedWord">
        正确的单词是：<strong>{{ revealedWord }}</strong>
        <span @click="playAudio(revealedWord)" class="play-icon">🔊</span>
      </div>
    </div>

    <div v-else class="loading">
      <h2>太棒了！本轮结束 🎉</h2>
      <button @click="startRound" class="next-btn">开始下一轮</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Word } from '../store/gameDict';
import { useDictStore } from '../store/gameDict';
import { playAudio } from '../utils/audio';

const dictStore = useDictStore();

const words = ref<Word[]>([]);
const currentIndex = ref(0);
const currentWord = computed(() => words.value[currentIndex.value]);

const userInput = ref('');
const isError = ref(false);
const revealedWord = ref('');
const combo = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const ROUND_SIZE = 10;

const startRound = () => {
  words.value = dictStore.getRandomWords(ROUND_SIZE);
  currentIndex.value = 0;
  resetState();
};

const resetState = () => {
  userInput.value = '';
  isError.value = false;
  revealedWord.value = '';
  setTimeout(() => inputRef.value?.focus(), 100);
};

const checkAnswer = () => {
  if (!currentWord.value || !userInput.value.trim()) return;

  const target = currentWord.value.word.toLowerCase();
  const input = userInput.value.trim().toLowerCase();

  if (target === input) {
    // 正确
    dictStore.recordWord(target, !revealedWord.value);
    playAudio(target);
    combo.value++;
    
    setTimeout(() => {
      currentIndex.value++;
      resetState();
    }, 600);
  } else {
    // 错误
    combo.value = 0;
    isError.value = true;
    setTimeout(() => { isError.value = false; }, 500);
  }
};

const showHint = () => {
  if (currentWord.value && !userInput.value) {
    userInput.value = currentWord.value.word.charAt(0);
  }
};

const skipWord = () => {
  if (!currentWord.value) return;
  revealedWord.value = currentWord.value.word;
  dictStore.recordWord(currentWord.value.word, false);
  combo.value = 0;
  playAudio(revealedWord.value);
  
  setTimeout(() => {
    currentIndex.value++;
    resetState();
  }, 2000);
};

onMounted(() => {
  startRound();
});
</script>

<style scoped>
.fill-game {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.back-btn {
  padding: 8px 16px;
  background: #ecf0f1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
.stats {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}
.game-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
}
.meaning-box {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
}
.question {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 10px;
}
.chinese {
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1.5;
}
.input-box {
  width: 100%;
  margin-bottom: 20px;
}
.word-input {
  width: 100%;
  padding: 15px 20px;
  font-size: 24px;
  border: 2px solid #bdc3c7;
  border-radius: 12px;
  text-align: center;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.word-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.2);
}
.error-shake {
  border-color: #e74c3c !important;
  animation: shake 0.4s;
}
.actions {
  width: 100%;
}
.submit-btn {
  width: 100%;
  padding: 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.submit-btn:hover {
  background: #2980b9;
}
.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
.hint-btn, .skip-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  color: #7f8c8d;
}
.hint-btn:hover, .skip-btn:hover {
  background: #f1f2f6;
}
.answer-reveal {
  margin-top: 20px;
  padding: 15px;
  background: #ffeaa7;
  border-radius: 8px;
  color: #d35400;
  font-size: 18px;
  text-align: center;
}
.play-icon {
  cursor: pointer;
  margin-left: 10px;
}
.loading {
  text-align: center;
  padding: 50px;
}
.next-btn {
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}
</style>
