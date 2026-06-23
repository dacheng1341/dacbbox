<template>
  <div class="spell-game">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      <div class="stats">
        <span>进度: {{ currentIndex + 1 }} / {{ words.length }}</span>
      </div>
    </div>

    <div class="game-area" v-if="currentWord">
      <div class="audio-btn" @click="playSound">🔊 播放发音</div>
      <div class="meaning" v-if="showHint">{{ currentWord.trans?.[0]?.cn }}</div>
      
      <div class="input-area">
        <span 
          v-for="(char, index) in userInput" 
          :key="'in_'+index" 
          class="char-box filled"
          @click="removeChar(index)"
        >
          {{ char }}
        </span>
        <span 
          v-for="i in Math.max(0, currentWord.word.length - userInput.length)" 
          :key="'emp_'+i" 
          class="char-box empty"
        ></span>
      </div>

      <div class="scrambled-area">
        <span 
          v-for="(char, index) in scrambledLetters" 
          :key="'sc_'+index" 
          class="char-btn"
          :class="{ 'used': usedIndices.includes(index) }"
          @click="addChar(char, index)"
        >
          {{ char }}
        </span>
      </div>

      <div class="controls">
        <button @click="showHint = true" class="hint-btn">👀 提示释义</button>
        <button @click="playSound" class="hint-btn">🔊 重新听音</button>
      </div>
    </div>

    <div v-else class="loading">
      <h2>游戏完成！🎉</h2>
      <button @click="startRound" class="next-btn">再来一局</button>
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

const scrambledLetters = ref<string[]>([]);
const userInput = ref<string[]>([]);
const usedIndices = ref<number[]>([]);
const showHint = ref(false);

const ROUND_SIZE = 10;

const startRound = () => {
  words.value = dictStore.getRandomWords(ROUND_SIZE);
  currentIndex.value = 0;
  setupWord();
};

const setupWord = () => {
  if (!currentWord.value) return;
  const wordStr = currentWord.value.word.toLowerCase();
  // 乱序打乱字母
  scrambledLetters.value = wordStr.split('').sort(() => 0.5 - Math.random());
  userInput.value = [];
  usedIndices.value = [];
  showHint.value = false;
  playSound();
};

const playSound = () => {
  if (currentWord.value) {
    playAudio(currentWord.value.word);
  }
};

const addChar = (char: string, index: number) => {
  if (usedIndices.value.includes(index)) return;
  
  userInput.value.push(char);
  usedIndices.value.push(index);

  checkWin();
};

const removeChar = (inputIndex: number) => {
  // 移除最后一个输入的字符
  if (inputIndex !== userInput.value.length - 1) return;
  userInput.value.pop();
  usedIndices.value.pop();
};

const checkWin = () => {
  if (!currentWord.value) return;
  const currentInputStr = userInput.value.join('');
  const targetStr = currentWord.value.word.toLowerCase();

  if (currentInputStr === targetStr) {
    dictStore.recordWord(targetStr, !showHint.value);
    // 答对了，进入下一个
    setTimeout(() => {
      currentIndex.value++;
      setupWord();
    }, 500);
  } else if (currentInputStr.length === targetStr.length) {
    // 拼错了
    dictStore.recordWord(targetStr, false);
    // 这里简单用 UI 抖动或者清空
    setTimeout(() => {
      userInput.value = [];
      usedIndices.value = [];
    }, 400);
  }
};

onMounted(() => {
  startRound();
});
</script>

<style scoped>
.spell-game {
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
  gap: 20px;
}
.audio-btn {
  font-size: 24px;
  cursor: pointer;
  padding: 15px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
  transition: transform 0.2s;
}
.audio-btn:active {
  transform: scale(0.9);
}
.meaning {
  font-size: 18px;
  color: #e67e22;
  font-weight: bold;
}
.input-area {
  display: flex;
  gap: 8px;
  margin: 20px 0;
  flex-wrap: wrap;
  justify-content: center;
}
.char-box {
  width: 40px;
  height: 40px;
  border-bottom: 3px solid #34495e;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
}
.char-box.filled {
  color: #2c3e50;
  cursor: pointer;
}
.char-box.empty {
  color: transparent;
}
.scrambled-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
.char-btn {
  width: 45px;
  height: 45px;
  background: #ecf0f1;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
  border: 1px solid #bdc3c7;
}
.char-btn:hover {
  background: #bdc3c7;
}
.char-btn.used {
  opacity: 0;
  pointer-events: none;
}
.controls {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}
.hint-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  color: #7f8c8d;
}
.hint-btn:hover {
  background: #f1f2f6;
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
}
</style>
