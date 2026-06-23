import { defineStore } from 'pinia';
import { shallowReactive, ref, toRaw } from 'vue';
import { storage } from '../utils/storage';

export interface WordTrans {
  pos: string;
  cn: string;
}

export interface Word {
  word: string;
  phonetic0?: string;
  phonetic1?: string;
  trans: WordTrans[];
}

export interface WordProgress {
  interval: number;
  ef: number;
  next_review: number;
  mistakes: number;
}

export interface GameDictState {
  id: string;
  name: string;
  words: Word[]; // 浅层响应式
  progress: Record<string, WordProgress>;
  lastLearnIndex: number;
  statistics: any[];
}

// 预定义词库列表
export const DICT_LIST = [
  { id: 'ielts', name: '雅思词库', url: '/data/ielts.json' },
  { id: '4000_core', name: '4000核心词汇', url: '/data/4000_core.json' }
];

export const useDictStore = defineStore('gameDict', () => {
  const currentDictId = ref<string>('');
  const words = shallowReactive<Word[]>([]);
  const progress = ref<Record<string, WordProgress>>({});
  const lastLearnIndex = ref(0);
  const statistics = ref<any[]>([]);

  const isLoaded = ref(false);

  // 动态切换与加载字典
  async function loadDict(dictId: string) {
    if (currentDictId.value === dictId && isLoaded.value) return;

    isLoaded.value = false;
    currentDictId.value = dictId;

    // 清理内存
    words.splice(0, words.length);

    const dictInfo = DICT_LIST.find(d => d.id === dictId);
    if (!dictInfo) {
      console.error('Unknown dict id:', dictId);
      return;
    }

    try {
      // 从 CDN/静态目录 加载词典完整 JSON
      const res = await fetch(dictInfo.url);
      const data: Word[] = await res.json();
      words.push(...data); // 浅层代理，不卡顿

      // 从 IDB 恢复进度
      const savedProgress = await storage.load(`progress_${dictId}`, {});
      progress.value = savedProgress as Record<string, WordProgress>;

      lastLearnIndex.value = await storage.load(`lastLearnIndex_${dictId}`, 0);
      statistics.value = await storage.load(`statistics_${dictId}`, []);

      isLoaded.value = true;
    } catch (e) {
      console.error('Failed to load dict:', e);
    }
  }

  // 保存进度到 IDB
  async function saveProgress() {
    if (!currentDictId.value) return;
    await storage.save(`progress_${currentDictId.value}`, toRaw(progress.value));
    await storage.save(`lastLearnIndex_${currentDictId.value}`, lastLearnIndex.value);
    await storage.save(`statistics_${currentDictId.value}`, toRaw(statistics.value));
  }

  // 记录单词对错 (模拟简化版的间隔重复)
  async function recordWord(wordStr: string, isCorrect: boolean) {
    if (!progress.value[wordStr]) {
      progress.value[wordStr] = { interval: 0, ef: 2.5, next_review: 0, mistakes: 0 };
    }
    const wp = progress.value[wordStr];
    if (!isCorrect) {
      wp.mistakes += 1;
      wp.interval = 1;
      wp.ef = Math.max(1.3, wp.ef - 0.2);
    } else {
      if (wp.interval === 0) wp.interval = 1;
      else wp.interval = Math.round(wp.interval * wp.ef);
    }
    wp.next_review = Date.now() + wp.interval * 86400000;
    await saveProgress();
  }

  // 获取一批随机单词 (供游戏使用)
  function getRandomWords(count: number): Word[] {
    if (words.length === 0) return [];
    // 洗牌算法抽取
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  return {
    currentDictId,
    words,
    progress,
    lastLearnIndex,
    statistics,
    isLoaded,
    loadDict,
    saveProgress,
    recordWord,
    getRandomWords
  };
});
