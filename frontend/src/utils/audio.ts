export const PronunciationApi = 'https://dict.youdao.com/dictvoice?audio=';

// type: 1 = 英音, 2 = 美音, 不传默认美音或自动判断
export const playAudio = (word: string, type: 1 | 2 = 1) => {
  if (!word) return;
  const audio = new Audio(`${PronunciationApi}${encodeURIComponent(word)}&type=${type}`);
  audio.play().catch(e => {
    console.error('播放发音失败:', e);
  });
};
