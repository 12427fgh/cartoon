import { showModal } from './ui-helpers.js';
// splash.js - 开场动画管理模块 (修复版)
// 参考 core.js 中的 initializeRandomUI 逻辑：隐藏主界面 -> 显示动画 -> 淡出 -> 显示主界面

// 存储 key
const STORAGE_IMAGES = 'splash_images';
const STORAGE_TEXTS  = 'splash_texts';

// 默认资源（保证用户不添加任何内容时也能显示）
const DEFAULT_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23333"/%3E%3Ccircle cx="400" cy="300" r="150" fill="%23ffb7c5"/%3E%3Ctext x="400" y="320" font-size="40" text-anchor="middle" fill="white"%3E❤️%3C/text%3E%3C/svg%3E';
const DEFAULT_TEXTS = ['✨ 欢迎回来 ✨', '💖 想你了', '🌙 今晚月色真美', '🌸 又是美好的一天', '🎐 风里都是你的气息'];

// 内部数据
let splashImages = [];
let splashTexts = [];

// DOM 元素
let splashScreen = null;
let splashBg = null;
let splashTextEl = null;

// ======================== 数据读取与保存 ========================
async function loadData() {
    try {
        const storedImages = await localforage.getItem(STORAGE_IMAGES);
        splashImages = Array.isArray(storedImages) ? storedImages : [];
        const storedTexts = await localforage.getItem(STORAGE_TEXTS);
        splashTexts = Array.isArray(storedTexts) ? storedTexts : [];
    } catch(e) {
        console.warn('加载开场动画库失败', e);
        splashImages = [];
        splashTexts = [];
    }
    if (splashImages.length === 0) {
        splashImages = [DEFAULT_IMAGE_URL];
    }
    if (splashTexts.length === 0) {
        splashTexts = [...DEFAULT_TEXTS];
    }
}

async function saveImages() {
    await localforage.setItem(STORAGE_IMAGES, splashImages);
}

async function saveTexts() {
    await localforage.setItem(STORAGE_TEXTS, splashTexts);
}

function getRandomImage() {
    if (!splashImages.length) return DEFAULT_IMAGE_URL;
    const randomIndex = Math.floor(Math.random() * splashImages.length);
    return splashImages[randomIndex];
}

function getRandomText() {
    if (!splashTexts.length) return DEFAULT_TEXTS[0];
    const randomIndex = Math.floor(Math.random() * splashTexts.length);
    return splashTexts[randomIndex];
}

// ======================== 核心：播放开场动画 ========================
// 参考 core.js 中的欢迎动画：先隐藏主界面 -> 播放动画 -> 淡出 -> 显示主界面
async function showSplash() {
    await loadData();
    
    splashScreen = document.getElementById('splash-screen');
    splashBg = document.getElementById('splash-bg');
    splashTextEl = document.getElementById('splash-text');
    const chatApp = document.getElementById('chatApp');
    
    if (!splashScreen) return;

    // 1. 确保主界面不可见（对应 core.js 中初始隐藏聊天区域的逻辑）
    if (chatApp) chatApp.classList.remove('visible');
    
    // 2. 随机设置背景图和文字
    const imgUrl = getRandomImage();
    const text = getRandomText();
    splashBg.style.backgroundImage = `url(${imgUrl})`;
    splashTextEl.textContent = text;
    
    // 3. 重置样式并显示全屏动画层
    splashScreen.style.display = 'flex';
    splashScreen.classList.remove('fade-out');
    
    // 4. 动画持续3秒，然后淡出（对应 core.js 中的 setTimeout 延迟操作）
     setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.style.display = 'none';
            // 5. 动画结束，显示主界面
            if (chatApp) chatApp.classList.add('visible');
            // ========== 关键修复：重启自动发送定时器 ==========
            if (window.restartAutoSpeakTimer && typeof window.restartAutoSpeakTimer === 'function') {
                window.restartAutoSpeakTimer();
            }
            // ========== 修复结束 ==========
        }, 800);
    }, 3000);
}

// ======================== 管理界面：图片和文字库 ========================
function renderImagesList() {
    const container = document.getElementById('splash-images-list');
    if (!container) return;
    container.innerHTML = '';
    if (splashImages.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);">暂无图片，请点击添加</div>';
        return;
    }
    splashImages.forEach((imgUrl, idx) => {
        const isDefault = (imgUrl === DEFAULT_IMAGE_URL);
        const div = document.createElement('div');
        div.style.cssText = 'position:relative; width:80px; height:80px; border-radius:12px; overflow:hidden; cursor:pointer; border:2px solid var(--border-color);';
        div.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        if (!isDefault) {
            const delBtn = document.createElement('div');
            delBtn.innerHTML = '✕';
            delBtn.style.cssText = 'position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#fff; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer;';
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('删除这张图片？')) {
                    splashImages.splice(idx, 1);
                    if (splashImages.length === 0) {
                        splashImages.push(DEFAULT_IMAGE_URL);
                    }
                    await saveImages();
                    renderImagesList();
                }
            });
            div.appendChild(delBtn);
        }
        container.appendChild(div);
    });
}

function renderTextsList() {
    const container = document.getElementById('splash-texts-list');
    if (!container) return;
    container.innerHTML = '';
    if (splashTexts.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);">暂无文字，请点击添加</div>';
        return;
    }
    splashTexts.forEach((text, idx) => {
        const isDefault = DEFAULT_TEXTS.includes(text);
        const chip = document.createElement('span');
        chip.style.cssText = 'display:inline-flex; align-items:center; gap:6px; background:var(--secondary-bg); padding:4px 12px; border-radius:30px; font-size:13px; border:1px solid var(--border-color); cursor:pointer;';
        chip.innerHTML = `${text} ${!isDefault ? '<span style="color:#ff6b6b;">✕</span>' : ''}`;
        if (!isDefault) {
            chip.addEventListener('click', async () => {
                if (confirm(`删除文字「${text}」？`)) {
                    splashTexts.splice(idx, 1);
                    if (splashTexts.length === 0) {
                        splashTexts = [...DEFAULT_TEXTS];
                    }
                    await saveTexts();
                    renderTextsList();
                }
            });
        }
        container.appendChild(chip);
    });
}

async function addSplashImage(file) {
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
    }
    // 简单压缩：限制宽度为 1280px
    const compressed = await compressImage(file, 1280);
    splashImages.push(compressed);
    await saveImages();
    renderImagesList();
    alert('已添加图片到开场动画库');
}

function compressImage(file, maxWidth) {
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
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function addSplashText(text) {
    text = text.trim();
    if (!text) return;
    if (splashTexts.includes(text)) {
        alert('文字已存在');
        return;
    }
    splashTexts.push(text);
    await saveTexts();
    renderTextsList();
    alert('已添加开场文字');
}

function bindManageEvents() {
    const addImageBtn = document.getElementById('splash-add-image-btn');
    const imageInput = document.getElementById('splash-image-input');
    const addTextBtn = document.getElementById('splash-add-text-btn');
    const newTextInput = document.getElementById('splash-new-text');
    const closeBtn = document.getElementById('close-splash-manage');
    
    if (addImageBtn && imageInput) {
        addImageBtn.onclick = () => imageInput.click();
        imageInput.onchange = async (e) => {
            if (e.target.files.length) {
                await addSplashImage(e.target.files[0]);
                imageInput.value = '';
            }
        };
    }
    if (addTextBtn && newTextInput) {
        addTextBtn.onclick = async () => {
            await addSplashText(newTextInput.value);
            newTextInput.value = '';
        };
    }
    if (closeBtn) {
        closeBtn.onclick = () => {
            const modal = document.getElementById('splash-manage-modal');
            if (modal) modal.style.display = 'none';
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.style.display = 'none';
        };
    }
}

function openManageModal() {
    renderImagesList();
    renderTextsList();
    const modal = document.getElementById('splash-manage-modal');
    if (modal && typeof showModal === 'function') showModal(modal);
    else if (modal) modal.style.display = 'flex';
}

// ======================== 全局导出 ========================
window.splashManager = {
    show: showSplash,
    openManage: openManageModal
};

// 绑定管理界面的事件（保证管理按钮可用）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindManageEvents);
} else {
    bindManageEvents();
}