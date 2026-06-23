const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 运行方式： node anki_to_json.js

// 1. 配置项
const INPUT_FILE = path.join(__dirname, 'anki_export.txt'); // 请将Anki导出的TXT文件放在scripts目录下并命名为 anki_export.txt
const OUTPUT_FILE = path.join(__dirname, '../public/data/words.json');

// 分类配置（根据您的需求写死或者根据 Anki 的 tag 生成）
const TARGET_CATEGORY_ID = 'ielts_4000'; // 给定一个统一的分类ID
const TARGET_CATEGORY_NAME = '雅思及4000核心词汇';

// Anki 导出文件中的字段顺序映射（重要：请根据您 Anki 卡片模板的实际字段顺序修改以下索引！）
// 注意：索引从 0 开始。如果 Anki 导出的第一列是单词，那么 word_index 就是 0
const FIELD_MAP = {
    word: 0,           // 单词本尊，例如 "apple"
    phonetic: 1,       // 音标，例如 "[ˈæpl]"
    meaning: 2,        // 中文释义
    example: 3,        // 英文例句
    example_meaning: 4,// 例句翻译
    memory: 5,         // 记忆法/助记
    audio: 6,          // 单词发音 (Anki 通常格式为 [sound:xxx.mp3])
    example_audio: 7,  // 例句发音
    img1: 8            // 图片 (Anki 通常格式为 <img src="xxx.jpg">)
};

async function processAnkiExport() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ 找不到文件：${INPUT_FILE}`);
        console.log(`💡 请在 Anki 中选择您的牌组 -> 导出 -> 导出格式选为"纯文本(*.txt)"。`);
        console.log(`   取消勾选"包含 HTML 和媒体引用"（或者根据需要保留，脚本会自动提取音频和图片名）。`);
        console.log(`   然后将导出的文件放到 ${__dirname} 下，并改名为 anki_export.txt`);
        return;
    }

    const fileStream = fs.createReadStream(INPUT_FILE, 'utf-8');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const words = [];
    let idCounter = 1;

    for await (const line of rl) {
        // Anki 导出的纯文本文件是以制表符 (Tab) 分隔的
        const fields = line.split('\t');
        
        // 忽略空行
        if (fields.length < 2) continue;

        // 提取并清洗数据
        const word = cleanAnkiField(fields[FIELD_MAP.word]);
        if (!word) continue;

        words.push({
            id: `anki_${idCounter++}`,
            word: word,
            category_ids: [TARGET_CATEGORY_ID],
            phonetic: cleanAnkiField(fields[FIELD_MAP.phonetic]),
            meaning: cleanAnkiField(fields[FIELD_MAP.meaning]),
            memory: cleanAnkiField(fields[FIELD_MAP.memory]),
            example: cleanAnkiField(fields[FIELD_MAP.example]),
            // 提取 [sound:xxx.mp3] 中的文件名，或者剥离 <img> 标签
            audio: extractMediaFilename(fields[FIELD_MAP.audio]),
            example_audio: extractMediaFilename(fields[FIELD_MAP.example_audio]),
            img1: extractMediaFilename(fields[FIELD_MAP.img1]),
            
            // 下面是兼容原数据结构的空字段
            en_meaning: "", 
            en_audio: "",
            img2: ""
        });
    }

    const finalData = {
        categories: [
            { id: TARGET_CATEGORY_ID, name: TARGET_CATEGORY_NAME }
        ],
        words: words
    };

    // 确保目录存在
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
    console.log(`✅ 成功转换 ${words.length} 个单词！`);
    console.log(`📁 数据已保存到：${OUTPUT_FILE}`);
    console.log(`⚠️  请不要忘记将您的 Anki 媒体文件复制到项目的 public/assets 目录中！`);
    console.log(`   （Windows上的 Anki 媒体文件夹通常在： %APPDATA%\\Anki2\\您的用户名\\collection.media）`);
}

// 辅助函数：清洗 Anki 的引号和多余空格
function cleanAnkiField(field) {
    if (!field) return '';
    let cleaned = field.trim();
    // Anki 导出时可能会将包含换行或双引号的内容用双引号包裹，并将双引号转义为两个双引号
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
        cleaned = cleaned.replace(/""/g, '"');
    }
    return cleaned;
}

// 辅助函数：提取 [sound:xxx.mp3] 或 <img src="xxx.jpg"> 中的真实文件名
function extractMediaFilename(field) {
    if (!field) return '';
    const cleaned = cleanAnkiField(field);
    
    // 匹配 [sound:xxxx.mp3]
    const soundMatch = cleaned.match(/\[sound:(.*?)\]/);
    if (soundMatch && soundMatch[1]) {
        return soundMatch[1];
    }
    
    // 匹配 <img src="xxxx.jpg">
    const imgMatch = cleaned.match(/<img[^>]+src=["'](.*?)["']/i);
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
    }
    
    // 如果没有标签，返回原内容（可能是直接写的相对路径）
    return cleaned;
}

processAnkiExport();
