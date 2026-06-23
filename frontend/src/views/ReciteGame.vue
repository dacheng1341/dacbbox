<template>
  <div class="recite-game">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      <div class="stats">
        <span>今日进度: {{ currentIndex + 1 }} / {{ totalSessionWords }}</span>
      </div>
    </div>

    <div class="game-area" v-if="currentWord">
      <div class="flashcard">
        <div class="word">{{ currentWord.word }}</div>
        <div class="phonetic">[{{ currentWord.phonetic0 || currentWord.phonetic1 || '---' }}] <span @click="playAudio(currentWord.word)" class="play-icon">🔊</span></div>
        
        <div v-if="showMeaning" class="meaning">
          {{ currentWord.trans?.[0]?.cn || '未知释义' }}
        </div>
        <div v-else class="meaning-hidden" @click="showMeaning = true">
          点击显示释义
        </div>
      </div>

      <div class="controls" v-if="showMeaning">
        <button @click="recordResult(false)" class="btn wrong-btn">不认识</button>
        <button @click="recordResult(true)" class="btn right-btn">认识</button>
      </div>
      <div class="controls" v-else>
        <button @click="showMeaning = true" class="btn hint-btn">想不起来</button>
        <button @click="recordResult(true)" class="btn right-btn">认识</button>
      </div>
    </div>

    <div v-else class="loading">
      <h2>太棒了！今日任务完成 🎉</h2>
      <button @click="startRound" class="next-btn">继续学习</button>
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
const totalSessionWords = ref(10);
const currentWord = computed(() => words.value[currentIndex.value]);

const showMeaning = ref(false);

const startRound = () => {
  // 简化的艾宾浩斯：获取需要复习的词 + 新词
  const now = Date.now();
  const toReview = Object.entries(dictStore.progress)
    .filter(([_, p]) => p.next_review <= now)
    .sort((a, b) => a[1].next_review - b[1].next_review)
    .map(e => e[0]);

  const reviewWords = dictStore.words.filter(w => toReview.includes(w.word.toLowerCase())).slice(0, 5);
  
  // 提取新词
  const newWordsCount = 10 - reviewWords.length;
  const newWords = dictStore.words.slice(dictStore.lastLearnIndex, dictStore.lastLearnIndex + newWordsCount);
  dictStore.lastLearnIndex += newWordsCount;
  dictStore.saveProgress();

  words.value = [...reviewWords, ...newWords].sort(() => 0.5 - Math.random());
  totalSessionWords.value = words.value.length;
  currentIndex.value = 0;
  
  if (words.value.length > 0) {
    showMeaning.value = false;
    setTimeout(() => playAudio(currentWord.value?.word || ''), 300);
  }
};

const recordResult = (isCorrect: boolean) => {
  if (!currentWord.value) return;
  
  dictStore.recordWord(currentWord.value.word.toLowerCase(), isCorrect);
  
  if (!isCorrect && !showMeaning.value) {
    showMeaning.value = true;
    return; // 要求看完释义再点一次
  }

  // 下一个
  currentIndex.value++;
  showMeaning.value = false;
  if (currentWord.value) {
    setTimeout(() => playAudio(currentWord.value?.word || ''), 300);
  }
};

onMounted(() => {
  startRound();
});
</script>

<style scoped>
.recite-game {
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
}
.flashcard {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 40px 20px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}
.word {
  font-size: 40px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
}
.phonetic {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.play-icon {
  cursor: pointer;
}
.meaning {
  font-size: 22px;
  color: #e67e22;
  font-weight: bold;
  animation: fadeIn 0.3s;
}
.meaning-hidden {
  background: #f1f2f6;
  color: #a4b0be;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px dashed #ced6e0;
}
.controls {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 400px;
}
.btn {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn:active {
  transform: scale(0.95);
}
.wrong-btn {
  background: #e74c3c;
  color: white;
}
.hint-btn {
  background: #f39c12;
  color: white;
}
.right-btn {
  background: #2ecc71;
  color: white;
}
.loading {
  text-align: center;
  padding: 50px;
}
.next-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
