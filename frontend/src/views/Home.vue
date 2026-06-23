<template>
  <div class="home-page">
    <header class="home-header">
      <h1>英语学习游戏大厅</h1>
      <p>完全纯前端，云端数据同步 (准备中)</p>
    </header>

    <div class="dict-selector">
      <h3>1. 请选择当前词库</h3>
      <select v-model="dictStore.currentDictId" @change="onDictChange" class="selector">
        <option value="" disabled>-- 选择词库 --</option>
        <option v-for="dict in DICT_LIST" :key="dict.id" :value="dict.id">
          {{ dict.name }}
        </option>
      </select>
      <div v-if="dictStore.isLoaded" class="dict-info">
        当前词库共加载了 <strong>{{ dictStore.words.length }}</strong> 个单词
      </div>
    </div>

    <div class="game-list">
      <h3>2. 请选择要玩的游戏</h3>
      <div class="cards">
        <div class="game-card" @click="goTo('/match')">
          <div class="icon">🧩</div>
          <div class="title">单词消消乐</div>
          <div class="desc">经典消消乐玩法，快速复习单词意思。</div>
        </div>
        <div class="game-card" @click="goTo('/spell')">
          <div class="icon">⌨️</div>
          <div class="title">字母乱序拼写</div>
          <div class="desc">听音辨词，乱序拼写挑战记忆力。</div>
        </div>
        <div class="game-card" @click="goTo('/fill')">
          <div class="icon">📝</div>
          <div class="title">看意猜词填空</div>
          <div class="desc">根据中文意思填空，考察精准拼写。</div>
        </div>
        <div class="game-card" @click="goTo('/recite')">
          <div class="icon">📖</div>
          <div class="title">极速背单词</div>
          <div class="desc">基于艾宾浩斯记忆曲线的高效刷词工具。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useDictStore, DICT_LIST } from '../store/gameDict';

const router = useRouter();
const dictStore = useDictStore();

const onDictChange = async () => {
  if (dictStore.currentDictId) {
    await dictStore.loadDict(dictStore.currentDictId);
  }
};

const goTo = (path: string) => {
  if (!dictStore.isLoaded) {
    alert('请先选择并加载一个词库！');
    return;
  }
  router.push(path);
};
</script>

<style scoped>
.home-page {
  padding: 30px 20px;
}
.home-header {
  text-align: center;
  margin-bottom: 40px;
}
.home-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
}
.home-header p {
  color: #7f8c8d;
  margin-top: 10px;
}
.dict-selector {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}
.selector {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background: white;
}
.dict-info {
  margin-top: 10px;
  color: #27ae60;
  font-size: 14px;
}
.game-list h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.game-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}
.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  border-color: #3498db;
}
.game-card .icon {
  font-size: 40px;
  margin-bottom: 10px;
}
.game-card .title {
  font-weight: bold;
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 8px;
}
.game-card .desc {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.4;
}

@media (max-width: 600px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
