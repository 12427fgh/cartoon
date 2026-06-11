// ui-helpers.js
export function showModal(modal) {
    closeAllModals();
    if (modal) modal.style.display = 'flex';
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'block';
}

export function closeAllModals() {
    // 关闭所有弹窗
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => {
        m.style.display = 'none';
        m.style.removeProperty('z-index');
    });
    // 关掉遮罩层
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.removeProperty('z-index');
        overlay.style.pointerEvents = 'none';
    }
    // 删掉所有可能残留的遮罩
    const blockers = document.querySelectorAll('.modal-backdrop, .fixed-overlay');
    blockers.forEach(el => el.remove());
    // 恢复页面滚动
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
}

export function bindModalClosers() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.style.display = 'none';
        };
    });
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.onclick = closeAllModals;
}

export function hideModal(modal) {
    if (modal) modal.style.display = 'none';
    const overlay = document.getElementById('overlay');
    if (overlay && !document.querySelector('.modal[style*="display: flex"]')) {
        overlay.style.display = 'none';
    }
}
