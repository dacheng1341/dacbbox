<template>
  <div class="recite-wrapper">
    <div class="recite-game">
      <div class="header-nav">
        <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      </div>

      <h1 class="page-title">📖 专属记忆训练</h1>

      <div class="progress-bar">
        <div class="stat-item"><span class="label">已学</span> <span class="val text-blue">{{ learnedCount }}</span></div>
        <div class="stat-item"><span class="label">剩余</span> <span class="val text-orange">{{ remainCount }}</span></div>
        <div class="stat-item"><span class="label">答错</span> <span class="val text-red">{{ mistakeCount }}</span></div>
      </div>

      <div class="layout-main" v-if="currentWord">
        <div class="content-left">
          <div class="word-card">
            <h2 class="word-text">{{ currentWord.word }}</h2>
            <div class="phonetic-row">
              <span class="phonetic">[{{ currentWord.phonetic0 || currentWord.phonetic1 || '---' }}]</span>
              <button @click="playSound" class="play-btn">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>

            <div class="details-section" v-show="showMeaning">
              <div class="section-title">中文释义</div>
              <div class="meaning-text">{{ currentWord.trans?.[0]?.cn || '未知释义' }}</div>

              <div class="memory-assistant" v-if="currentWord.memory || hasMemoryBox">
                <div class="memory-tag">记忆助手</div>
                <h3 class="memory-title">记忆方法</h3>
                <p>{{ currentWord.memory || '暂无记忆法记录，请根据发音和词根辅助记忆。' }}</p>
                <div v-if="currentWord.etymology">
                  <h3 class="memory-title">中文词源</h3>
                  <p>{{ currentWord.etymology }}</p>
                </div>
              </div>
            </div>

            <div class="details-hidden" v-show="!showMeaning" @click="showMeaning = true">
              点击查看释义详情
            </div>

            <div class="action-row">
              <button class="btn-green" @click="nextStep">
                我记住了，去拼写 👉 (按空格键)
              </button>
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
                <span class="q-idx">{{ idx + 1 }}.</span> {{ w.word }}
                <span class="q-icon">{{ idx === currentIndex ? '👉' : '⏳' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="loading">
        <h2>🎉 本组学习完成！</h2>
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
import { useRouter } from 'vue-router';

const router = useRouter();
const dictStore = useDictStore();

const words = ref<Word[]>([]);
const currentIndex = ref(0);
const currentWord = computed(() => words.value[currentIndex.value]);

const showMeaning = ref(false);
const learnedCount = ref(0);
const remainCount = computed(() => words.value.length - currentIndex.value);
const mistakeCount = ref(0);

// Just a mock flag for the memory box if empty
const hasMemoryBox = true;

const startRound = () => {
  words.value = dictStore.getRandomWords(5); // 截图中一次学 5 个词
  currentIndex.value = 0;
  learnedCount.value = 0;
  mistakeCount.value = 0;
  showMeaning.value = false;
  
  if (words.value.length > 0) {
    setTimeout(playSound, 300);
  }
};

const playSound = () => {
  if (currentWord.value) {
    playAudio(currentWord.value.word);
  }
};

const nextStep = () => {
  if (!showMeaning.value) {
    showMeaning.value = true;
    return;
  }
  
  // Here we would ideally route to spelling mode or proceed
  // For the sake of standard flow, we go to next word
  dictStore.recordWord(currentWord.value.word, true);
  learnedCount.value++;
  currentIndex.value++;
  showMeaning.value = false;
  if (currentWord.value) {
    setTimeout(playSound, 300);
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault();
    nextStep();
  }
};

onMounted(() => {
  if(dictStore.words.length > 0) {
    startRound();
  } else {
    router.push('/');
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.recite-wrapper {
  background: #f8f9fc;
  min-height: 100vh;
  padding: 20px 10px;
}
.recite-game {
  max-width: 1000px;
  margin: 0 auto;
}
.header-nav {
  margin-bottom: 20px;
}
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
.progress-bar {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  margin-bottom: 30px;
}
.stat-item .label {
  color: #7f8c8d;
  font-size: 14px;
  margin-right: 10px;
}
.stat-item .val {
  font-size: 18px;
  font-weight: bold;
}
.text-blue { color: #3498db; }
.text-orange { color: #e67e22; }
.text-red { color: #e74c3c; }

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

.word-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
  text-align: center;
}
.word-text {
  font-size: 48px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}
.phonetic-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}
.phonetic {
  font-size: 20px;
  color: #7f8c8d;
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

.details-section {
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-top: 20px;
}
.section-title {
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 10px;
}
.meaning-text {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.6;
}

.memory-assistant {
  background: #fff9e6;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  margin-top: 30px;
}
.memory-tag {
  position: absolute;
  top: -12px;
  left: 20px;
  background: #f1c40f;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.memory-title {
  font-size: 16px;
  color: #d35400;
  margin: 15px 0 10px 0;
}
.memory-assistant p {
  font-size: 15px;
  color: #34495e;
  line-height: 1.6;
  margin: 0;
}

.details-hidden {
  color: #a29bfe;
  padding: 20px;
  border: 1px dashed #a29bfe;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}
.details-hidden:hover {
  background: #f8f7ff;
}

.action-row {
  margin-top: 40px;
}
.btn-green {
  width: 100%;
  background: #2ecc71;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
}
.btn-green:hover {
  background: #27ae60;
}

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
.queue-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
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
.q-idx {
  margin-right: 10px;
}
.q-icon {
  margin-left: auto;
}

@media (max-width: 768px) {
  .layout-main {
    flex-direction: column;
  }
  .content-right {
    width: 100%;
  }
}
</style>
