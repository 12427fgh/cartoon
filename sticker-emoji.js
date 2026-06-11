// sticker-emoji.js - 修复保存失败 + 发送失败问题
import { escapeHtml, readFileAsBase64 } from './utils.js';
import { saveMyStickers, saveOtherStickers, saveEmojis } from './data.js';
import { showModal, closeAllModals } from './ui-helpers.js';

let isImporting = false;

/**
 * 压缩图片，限制最大宽度，转为 base64
 * @param {File} file 图片文件
 * @param {number} maxWidth 最大宽度（像素）
 * @returns {Promise<string>} 压缩后的 base64 (JPEG, 质量0.8)
 */
function compressImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // 压缩为 JPEG，质量 0.8，大大减小体积
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function addMyStickers(files) {
    if (isImporting) {
        alert('正在处理上一组图片，请稍后再试');
        return;
    }
    if (!files || files.length === 0) {
        alert('没有选择文件');
        return;
    }
    isImporting = true;
    try {
        let added = 0;
        let errors = 0;
        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                // 压缩图片后再保存，避免 localStorage 超限
                const compressedBase64 = await compressImage(file, 800);
                window.myStickers.push({
                    id: Date.now() + '_' + Math.random(),
                    dataURL: compressedBase64
                });
                added++;
            } catch(e) {
                console.warn(e);
                errors++;
            }
        }
        if (added > 0) {
            saveMyStickers();
            renderMyStickersList();
            const pickerModal = document.getElementById('stickerPickerModal');
            if (pickerModal && pickerModal.style.display === 'flex') renderStickerPicker();
            alert(`✅ 成功添加 ${added} 张表情包` + (errors ? `，${errors} 张失败（格式不支持或损坏）` : ''));
        } else {
            alert('❌ 没有有效的图片文件，或文件无法读取');
        }
    } finally {
        isImporting = false;
    }
}

export async function addOtherStickers(files) {
    if (isImporting) {
        alert('正在处理上一组图片，请稍后再试');
        return;
    }
    if (!files || files.length === 0) {
        alert('没有选择文件');
        return;
    }
    isImporting = true;
    try {
        let added = 0;
        let errors = 0;
        for (let file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                // 同样压缩对方表情包
                const compressedBase64 = await compressImage(file, 800);
                window.otherStickers.push({
                    id: Date.now() + '_' + Math.random(),
                    dataURL: compressedBase64
                });
                added++;
            } catch(e) {
                console.warn(e);
                errors++;
            }
        }
        if (added > 0) {
            saveOtherStickers();
            renderOtherStickersList();
            alert(`✅ 成功添加 ${added} 张对方表情包` + (errors ? `，${errors} 张失败` : ''));
        } else {
            alert('❌ 没有有效的图片文件，或文件无法读取');
        }
    } finally {
        isImporting = false;
    }
}

export function deleteMySticker(id) {
    if (confirm("确定删除这张表情包吗？")) {
        window.myStickers = window.myStickers.filter(s => s.id !== id);
        saveMyStickers();
        renderMyStickersList();
        const pickerModal = document.getElementById('stickerPickerModal');
        if (pickerModal && pickerModal.style.display === 'flex') renderStickerPicker();
    }
}

export function deleteOtherSticker(id) {
    if (confirm("删除对方表情包？")) {
        window.otherStickers = window.otherStickers.filter(s => s.id !== id);
        saveOtherStickers();
        renderOtherStickersList();
    }
}

export function renderMyStickersList() {
    const container = document.getElementById('myStickersList');
    if (!container) return;
    container.innerHTML = '';
    if (!window.myStickers.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无表情包，点击「新增」添加</div>';
        return;
    }
    for (let s of window.myStickers) {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.onclick = (e) => {
            e.stopPropagation();
            deleteMySticker(s.id);
        };
        div.appendChild(img);
        container.appendChild(div);
    }
}

export function renderOtherStickersList() {
    const container = document.getElementById('otherStickersList');
    if (!container) return;
    container.innerHTML = '';
    if (!window.otherStickers.length) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">暂无对方表情包</div>';
        return;
    }
    for (let s of window.otherStickers) {
        const div = document.createElement('div');
        div.className = 'sticker-item';
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.onclick = (e) => {
            e.stopPropagation();
            deleteOtherSticker(s.id);
        };
        div.appendChild(img);
        container.appendChild(div);
    }
}
export function renderStickerPicker() {
    const container = document.getElementById('stickerPickerContent');
    if (!container) return;
    container.innerHTML = '';
    if (!window.myStickers.length) {
        container.innerHTML = '<div style="text-align:center; color:#999;">还没有我的表情包，请先导入😊</div>';
        return;
    }
    // 确保发送函数存在（理论上 core.js 已经挂载好了）
    if (typeof window.sendStickerMessage !== 'function') {
        container.innerHTML = '<div style="text-align:center; color:#c00;">发送功能未就绪，请刷新页面重试</div>';
        return;
    }
    for (let s of window.myStickers) {
        const img = document.createElement('img');
        img.src = s.dataURL;
        img.style.cssText = 'width:60px; height:60px; object-fit:cover; margin:6px; cursor:pointer; border-radius:12px;';
        img.onclick = () => {
            window.sendStickerMessage(s.dataURL);
            closeAllModals();
        };
        container.appendChild(img);
    }
}
export function renderEmojisList() {
    const container = document.getElementById('emojisList');
    if (!container) return;
    container.innerHTML = '';
    for (let e of window.emojis) {
        const div = document.createElement('div');
        div.className = 'emoji-item';
        const emojiSpan = document.createElement('div');
        emojiSpan.className = 'emoji-char';
        emojiSpan.textContent = e.char;
        emojiSpan.style.cursor = 'pointer';
        emojiSpan.onclick = (function(id, char) {
            return function() {
                if (confirm(`删除 "${char}" 吗？`)) deleteEmoji(id);
            };
        })(e.id, e.char);
        div.appendChild(emojiSpan);
        container.appendChild(div);
    }
}

export function addEmoji(char) {
    if (!char.trim()) return;
    if (window.emojis.some(e => e.char === char)) {
        alert("已存在");
        return;
    }
    window.emojis.push({
        id: Date.now() + '_' + Math.random(),
        char: char
    });
    saveEmojis();
    renderEmojisList();
}

export function deleteEmoji(id) {
    window.emojis = window.emojis.filter(e => e.id !== id);
    saveEmojis();
    renderEmojisList();
}

export function getRandomEmoji() {
    if (window.emojis.length === 0) return null;
    return window.emojis[Math.floor(Math.random() * window.emojis.length)].char;
}// 挂载到 window，供 reply-library.js 调用
window.renderMyStickersList = renderMyStickersList;
window.renderOtherStickersList = renderOtherStickersList;
window.renderEmojisList = renderEmojisList;
