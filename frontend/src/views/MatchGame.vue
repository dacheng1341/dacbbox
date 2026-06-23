<template>
  <div class="match-game-wrapper">
    <div class="match-game">
      <h1>✨ 智能单词消消乐 ✨</h1>
      <div class="settings-bar">
        <div class="controls-row">
          <button @click="$router.push('/')" class="btn-act btn-shuffle">⬅ 返回大厅</button>
        </div>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">分数</span>
            <span class="stat-value text-green">{{ score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">连击</span>
            <span class="stat-value text-orange">{{ combo }}</span>
          </div>
        </div>
        
        <div class="btn-group">
          <button class="btn-act btn-review" @click="startRound">🔄 重新洗牌</button>
        </div>
      </div>
      
      <div class="game-board" v-if="items.length > 0">
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="card"
          :class="[
            item.type === 'en' ? 'card-en' : 'card-cn',
            {
              'selected': selectedItem?.id === item.id,
              'matched': item.matched,
              'error': errorIds.includes(item.id)
            }
          ]"
          @click="selectCard(item)"
        >
          <span class="card-text">{{ item.text }}</span>
        </div>
      </div>
      
      <div v-else class="loading">
        <h2 style="color: white">加载中或已通关本轮...</h2>
        <button @click="startRound" class="btn-act btn-new">开始下一轮</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDictStore } from '../store/gameDict';
import { playAudio } from '../utils/audio';

const dictStore = useDictStore();

interface MatchItem {
  id: string; // word_xxx_en or word_xxx_cn
  wordRef: string; // The actual english word
  text: string; // Display text (english or chinese)
  type: 'en' | 'cn';
  matched: boolean;
}

const items = ref<MatchItem[]>([]);
const selectedItem = ref<MatchItem | null>(null);
const errorIds = ref<string[]>([]);
const combo = ref(0);
const score = ref(0);

const ROUND_SIZE = 6; // 每次出6对

const startRound = () => {
  const words = dictStore.getRandomWords(ROUND_SIZE);
  const newItems: MatchItem[] = [];
  
  words.forEach((w, index) => {
    // 英文卡片
    newItems.push({
      id: `w_${index}_en`,
      wordRef: w.word,
      text: w.word,
      type: 'en',
      matched: false
    });
    // 中文卡片
    newItems.push({
      id: `w_${index}_cn`,
      wordRef: w.word,
      text: w.trans?.[0]?.cn || '未知释义',
      type: 'cn',
      matched: false
    });
  });

  // 打乱顺序
  items.value = newItems.sort(() => 0.5 - Math.random());
};

const selectCard = (item: MatchItem) => {
  if (item.matched) return;
  
  // 播放发音
  if (item.type === 'en') {
    playAudio(item.wordRef);
  }

  if (!selectedItem.value) {
    selectedItem.value = item;
    return;
  }

  // 点击了自己
  if (selectedItem.value.id === item.id) {
    selectedItem.value = null;
    return;
  }

  // 点击了同类型的卡片 (比如又点了一个英文)，切换选中
  if (selectedItem.value.type === item.type) {
    selectedItem.value = item;
    return;
  }

  // 判断是否匹配
  if (selectedItem.value.wordRef === item.wordRef) {
    // 匹配成功
    item.matched = true;
    selectedItem.value.matched = true;
    combo.value++;
    score.value += 10 * combo.value;
    dictStore.recordWord(item.wordRef, true); // 记录对
    selectedItem.value = null;
    
    // 检查是否全清
    if (items.value.every(i => i.matched)) {
      setTimeout(() => {
        items.value = [];
      }, 500);
    }
  } else {
    // 匹配失败
    combo.value = 0;
    const errId1 = selectedItem.value.id;
    const errId2 = item.id;
    errorIds.value.push(errId1, errId2);
    dictStore.recordWord(item.wordRef, false); // 记录错
    
    setTimeout(() => {
      errorIds.value = errorIds.value.filter(id => id !== errId1 && id !== errId2);
    }, 800);
    
    selectedItem.value = null;
  }
};

onMounted(() => {
  if(dictStore.words.length > 0) {
    startRound();
  }
});
</script>

<style scoped>
.match-game-wrapper {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  min-height: 100vh;
  width: 100%;
  padding: 20px 10px;
  box-sizing: border-box;
}

.match-game {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  color: #ffffff;
  margin: 0 0 20px 0;
  font-size: 28px;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-weight: 900;
  letter-spacing: 2px;
}

.settings-bar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 15px 25px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.controls-row {
  display: flex;
  width: 100%;
  justify-content: flex-start;
}

.stats-row {
  display: flex;
  width: 100%;
  justify-content: space-around;
  border-top: 1px dashed #e0e0e0;
  border-bottom: 1px dashed #e0e0e0;
  padding: 10px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: bold;
}

.stat-value {
  font-size: 20px;
  font-weight: 900;
}

.text-green { color: #2ecc71; }
.text-orange { color: #f39c12; }

.btn-group {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: center;
}

.btn-act {
  flex: 1;
  min-width: 110px;
  padding: 12px 10px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-review {
  background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
}
.btn-review:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(79, 172, 254, 0.4);
}
.btn-new {
  background: linear-gradient(to right, #43e97b 0%, #38f9d7 100%);
  color: #2c3e50;
}
.btn-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(67, 233, 123, 0.4);
}
.btn-shuffle {
  background: rgba(255, 255, 255, 0.9);
  flex: 0 0 100%;
  max-width: 120px;
  border: 2px dashed #a18cd1;
  border-radius: 8px;
  font-size: 14px;
  color: #5B4B8A;
  padding: 8px;
  box-shadow: none;
}
.btn-shuffle:hover {
  background: #fff;
  border-style: solid;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 10px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.card-en {
  border: 3px solid #43e97b;
  color: #2c3e50;
  font-weight: 800;
  font-size: 16px;
}

.card-cn {
  border: 3px solid #a18cd1;
  color: #5B4B8A;
  font-weight: bold;
  font-size: 14px;
}

.card:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-text {
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card.selected {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
  border-color: #fff;
  transform: scale(1.05);
}

.card.selected .card-text {
  color: white;
}

.card.matched {
  visibility: hidden;
  opacity: 0;
  transform: scale(0.5);
}

.card.error {
  background: #ff0844;
  border-color: #ff0844;
  animation: shake 0.4s;
}

.card.error .card-text {
  color: white;
}

.loading {
  text-align: center;
  padding: 50px;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-8px) rotate(-2deg); }
  50% { transform: translateX(8px) rotate(2deg); }
  75% { transform: translateX(-8px) rotate(-2deg); }
  100% { transform: translateX(0); }
}

@media (max-width: 600px) {
  .game-board {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
