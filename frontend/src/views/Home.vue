<template>
  <div class="home-wrapper">
    <div class="home">
      <div class="header">
        <h1>🚀 英语学习游戏大厅</h1>
        <p class="subtitle">完全纯前端，云端数据同步</p>
      </div>
      
      <div class="main-card">
        <h2>1. 请选择当前词库</h2>
        <div class="dict-selector-container">
          <select v-model="selectedDict" class="dict-select">
            <option disabled value="">-- 选择词库 --</option>
            <optgroup v-for="(group, category) in groupedDicts" :key="category" :label="category">
              <option v-for="dict in group" :key="dict.id" :value="dict.id">
                {{ dict.name }} {{ dict.length ? `(${dict.length}词)` : '' }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="action-row">
          <button 
            @click="loadDictionary" 
            class="btn-load"
            :disabled="!selectedDict || isLoading"
            :class="{ loading: isLoading }"
          >
            {{ isLoading ? '🔄 加载词库中...' : '📥 确认加载该词库' }}
          </button>
        </div>

        <div v-if="dictStore.isLoaded" class="success-msg">
          ✅ 词库加载成功！当前单词量：{{ dictStore.words.length }}
        </div>
      </div>

      <div class="games-grid" v-if="dictStore.isLoaded">
        <h2>2. 请选择游戏模块</h2>
        <div class="grid">
          <div class="game-card" @click="$router.push('/match')">
            <div class="game-icon">✨</div>
            <h3>智能单词消消乐</h3>
            <p>通过经典消除游戏快速熟悉词意，连击获取高分！</p>
          </div>
          <div class="game-card" @click="$router.push('/spell')">
            <div class="game-icon">⌨️</div>
            <h3>字母拼写大挑战</h3>
            <p>盲听发音，将打乱的字母重新拼写为正确的单词。</p>
          </div>
          <div class="game-card" @click="$router.push('/fill')">
            <div class="game-icon">📝</div>
            <h3>看意猜词填空</h3>
            <p>仅提供中文释义，考验你的绝对记忆力，硬核拼写！</p>
          </div>
          <div class="game-card" @click="$router.push('/recite')">
            <div class="game-icon">📖</div>
            <h3>专属记忆训练</h3>
            <p>包含发音、词源、记忆法，科学管理复习计划。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DictMeta } from '../store/gameDict';
import { useDictStore } from '../store/gameDict';

const dictStore = useDictStore();
const selectedDict = ref('');
const isLoading = ref(false);

// 按分类对词库进行分组
const groupedDicts = computed(() => {
  const groups: Record<string, DictMeta[]> = {};
  dictStore.dictList.forEach(dict => {
    const cat = dict.category || '未分类';
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(dict);
  });
  return groups;
});

onMounted(async () => {
  await dictStore.fetchDictList();
  if (dictStore.currentDictId) {
    selectedDict.value = dictStore.currentDictId;
  }
});

const loadDictionary = async () => {
  if (!selectedDict.value) return;
  isLoading.value = true;
  await dictStore.loadDict(selectedDict.value);
  isLoading.value = false;
};
</script>

<style scoped>
.home-wrapper {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 40px 20px;
}
.home {
  max-width: 1000px;
  margin: 0 auto;
}
.header {
  text-align: center;
  margin-bottom: 40px;
}
h1 {
  font-size: 36px;
  color: #2c3e50;
  margin-bottom: 10px;
}
.subtitle {
  font-size: 18px;
  color: #7f8c8d;
}

.main-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 40px;
  text-align: center;
}
h2 {
  color: #34495e;
  margin-bottom: 25px;
  font-size: 24px;
}
.dict-selector-container {
  max-width: 500px;
  margin: 0 auto 30px;
}
.dict-select {
  width: 100%;
  padding: 15px 20px;
  font-size: 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  outline: none;
  background: white;
  cursor: pointer;
  transition: 0.3s;
  color: #2c3e50;
}
.dict-select:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}
.dict-select optgroup {
  font-weight: bold;
  color: #7f8c8d;
  font-style: normal;
}
.dict-select option {
  color: #2c3e50;
  padding: 5px;
}

.action-row {
  display: flex;
  justify-content: center;
}
.btn-load {
  background: #3498db;
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}
.btn-load:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}
.btn-load:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-load.loading {
  background: #95a5a6;
}
.success-msg {
  margin-top: 20px;
  color: #27ae60;
  font-weight: bold;
  font-size: 16px;
  background: #eafaf1;
  padding: 10px;
  border-radius: 8px;
  display: inline-block;
}

.games-grid {
  text-align: center;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 25px;
  margin-top: 20px;
}
.game-card {
  background: white;
  padding: 30px 20px;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid transparent;
}
.game-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  border-color: #3498db;
}
.game-icon {
  font-size: 48px;
  margin-bottom: 20px;
}
.game-card h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 20px;
}
.game-card p {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
}
</style>
