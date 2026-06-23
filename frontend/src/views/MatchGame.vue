<template>
  <div class="match-game">
    <div class="header">
      <button @click="$router.push('/')" class="back-btn">⬅ 返回大厅</button>
      <div class="stats">
        <span>连对: {{ combo }}</span>
        <span>得分: {{ score }}</span>
      </div>
    </div>
    
    <div class="game-board" v-if="items.length > 0">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="card"
        :class="{
          'selected': selectedItem?.id === item.id,
          'matched': item.matched,
          'error': errorIds.includes(item.id)
        }"
        @click="selectCard(item)"
      >
        <span class="card-text">{{ item.text }}</span>
      </div>
    </div>
    
    <div v-else class="loading">
      加载中或已通关本轮...
      <button @click="startRound" class="next-btn">开始下一轮</button>
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
  startRound();
});
</script>

<style scoped>
.match-game {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
.stats span {
  margin-left: 15px;
}
.game-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}
.card {
  background: white;
  border: 2px solid #bdc3c7;
  border-radius: 12px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  padding: 10px;
  text-align: center;
}
.card:hover {
  transform: scale(1.02);
  border-color: #3498db;
}
.card-text {
  font-size: 16px;
  font-weight: 500;
  color: #34495e;
}
.card.selected {
  background: #3498db;
  border-color: #2980b9;
}
.card.selected .card-text {
  color: white;
}
.card.matched {
  visibility: hidden;
  opacity: 0;
}
.card.error {
  background: #e74c3c;
  border-color: #c0392b;
  animation: shake 0.4s;
}
.card.error .card-text {
  color: white;
}
.loading {
  text-align: center;
  padding: 50px;
  color: #7f8c8d;
}
.next-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

@media (max-width: 600px) {
  .game-board {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
