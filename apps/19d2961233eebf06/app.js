/**
 * Password Vault - Core Logic
 */

// --- Constants & State ---
const APP_ID = 'password-vault';
let currentView = 'lock';
let masterPasswordHash = null;
let currentFilterType = 'all';
let searchQuery = '';
let editingId = null; // null for new, id for update
let isDarkMode = false;
let autoLockTimeout = 0; // minutes, 0 = never
let lockOnMinimize = true;
let recoveryEmail = '';
let autoLockTimer = null;

// --- Initialization ---
async function init() {
    if (!window.os) return;

    await setupDatabase();
    await loadAuthStatus();
    await loadDarkModePreference();
    await loadSettings();

    setupEventListeners();
    switchView('lock');
}

async function setupDatabase() {
    try {
        await os.database.exec(`
            CREATE TABLE IF NOT EXISTS credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                username TEXT,
                password TEXT,
                note TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        console.error("DB Setup Error:", e);
    }
}

async function loadAuthStatus() {
    const storedHash = await os.storage.get('master_password_hash');
    if (storedHash) {
        masterPasswordHash = storedHash;
    } else {
        document.getElementById('auth-message').textContent = 'Set your master password to begin';
        document.getElementById('unlock-btn').textContent = 'Create Password';
    }
}

// --- Settings ---
async function loadSettings() {
    if (!window.os) return;
    const storedTimeout = await os.storage.get('auto_lock_timeout');
    autoLockTimeout = storedTimeout !== null ? storedTimeout : 0;
    const storedMinimize = await os.storage.get('lock_on_minimize');
    lockOnMinimize = storedMinimize !== null ? storedMinimize : true;
    recoveryEmail = (await os.storage.get('recovery_email')) || '';
}

function startAutoLockTimer() {
    clearAutoLockTimer();
    if (autoLockTimeout > 0) {
        autoLockTimer = setTimeout(() => {
            if (currentView !== 'lock') {
                switchView('lock');
                if (window.os) os.notify("Vault auto-locked");
            }
        }, autoLockTimeout * 60 * 1000);
    }
}

function clearAutoLockTimer() {
    if (autoLockTimer !== null) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }
}

function resetAutoLockTimer() {
    if (currentView === 'dashboard') startAutoLockTimer();
}

// --- Dark Mode ---
async function loadDarkModePreference() {
    if (!window.os) return;
    const stored = await os.storage.get('dark_mode');
    isDarkMode = stored === true;
    applyDarkMode(isDarkMode);
}

function applyDarkMode(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const icon = dark ? '☀️' : '🌙';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    document.querySelectorAll('#btn-dark-mode, #btn-dark-mode-editor').forEach(btn => {
        btn.textContent = icon;
        btn.setAttribute('aria-label', label);
    });
}

async function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    applyDarkMode(isDarkMode);
    if (window.os) await os.storage.set('dark_mode', isDarkMode);
}

// --- Security Helpers ---
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- View Management ---
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.remove('hidden');
        currentView = viewName;
        if (viewName === 'dashboard') {
            renderCredentials();
            startAutoLockTimer();
        } else if (viewName === 'lock') {
            clearAutoLockTimer();
        }
    }
}

// --- Event Handlers ---
function setupEventListeners() {
    // Auth Form
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    document.getElementById('setup-btn')?.addEventListener('click', handleSetupMasterPassword);

    // Dashboard Actions
    document.getElementById('btn-add-new')?.addEventListener('click', () => {
        editingId = null;
        resetEditorForm();
        switchView('editor');
    });

    document.getElementById('btn-lock')?.addEventListener('click', () => switchView('lock'));
    document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);
    document.getElementById('btn-dark-mode-editor')?.addEventListener('click', toggleDarkMode);

    // Search & Filter
    document.getElementById('search-input')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCredentials();
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFilterType = e.target.dataset.type;
            renderCredentials();
        });
    });

    // Editor Actions
    document.getElementById('btn-cancel')?.addEventListener('click', () => switchView('dashboard'));
    document.getElementById('btn-save')?.addEventListener('click', handleSaveEntry);
    document.getElementById('btn-toggle-password')?.addEventListener('click', togglePasswordVisibility);

    // Field visibility logic
    document.getElementById('field-type')?.addEventListener('change', (e) => {
        const type = e.target.value;
        document.getElementById('group-username').style.display = (type === 'note') ? 'none' : 'block';
        document.getElementById('group-password').style.display = (type === 'note') ? 'none' : 'block';
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && lockOnMinimize && currentView !== 'lock') {
            switchView('lock');
            if (window.os) os.notify("Vault Locked");
        }
    });

    document.addEventListener('mousemove', resetAutoLockTimer);
    document.addEventListener('keydown', resetAutoLockTimer);
}

// --- Logic Handlers ---

async function handleAuthSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('master-password-input');
    const password = input.value;
    const hashed = await hashPassword(password);

    if (!masterPasswordHash) {
        // First time setup (handled by setup button, but fallback)
        await os.storage.set('master_password_hash', hashed);
        masterPasswordHash = hashed;
        os.notify("Master password set!");
        switchView('dashboard');
    } else {
        if (hashed === masterPasswordHash) {
            input.value = '';
            switchView('dashboard');
            os.notify("Vault Unlocked");
        } else {
            const msg = document.getElementById('auth-message');
            msg.textContent = "Incorrect password!";
            msg.style.color = "var(--danger-color)";
            setTimeout(() => {
                msg.textContent = "Enter master password to unlock";
                msg.style.color = "inherit";
            }, 2000);
        }
    }
}

async function handleSetupMasterPassword() {
    const newPass = prompt("Set a new Master Password:");
    if (!newPass) return;
    const hashed = await hashPassword(newPass);
    await os.storage.set('master_password_hash', hashed);
    masterPasswordHash = hashed;
    os.notify("Master password updated!");
}

async function handleSaveEntry(e) {
    const title = document.getElementById('field-title').value;
    const type = document.getElementById('field-type').value;
    const username = document.getElementById('field-username').value;
    const password = document.getElementById('field-password').value;
    const note = document.getElementById('field-note')?.value || '';

    if (!title) {
        os.notify("Title is required");
        return;
    }

    try {
        if (editingId) {
            await os.database.run(
                `UPDATE credentials SET title=?, type=?, username=?, password=?, note=? WHERE id=?`,
                [title, type, username, password, note, editingId]
            );
        } else {
            await os.database.run(
                `INSERT INTO credentials (title, type, username, password, note) VALUES (?, ?, ?, ?, ?)`,
                [title, type, username, password, note]
            );
        }
        switchView('dashboard');
        os.notify("Entry saved");
    } catch (err) {
        console.error(err);
        os.notify("Error saving entry");
    }
}

async function renderCredentials() {
    const listContainer = document.getElementById('credentials-list');
    if (!listContainer) return;

    let sql = `SELECT * FROM credentials WHERE 1=1`;
    const params = [];

    if (searchQuery) {
        sql += ` AND (title LIKE ? OR username LIKE ?)`;
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (currentFilterType !== 'all') {
        sql += ` AND type = ?`;
        params.push(currentFilterType);
    }

    sql += ` ORDER BY timestamp DESC`;

    try {
        const rows = await os.database.query(sql, params.length > 0 ? params : null);
        listContainer.innerHTML = '';

        if (rows.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; color:#6c757d;">No credentials found.</p>';
            return;
        }

        rows.forEach(row => {
            const item = document.createElement('div');
            item.className = 'credential-item';
            
            const typeLabel = row.type === 'user_pass' ? 'User/Pass' : (row.type === 'api_key' ? 'API Key' : 'Note');

            item.innerHTML = `
                <div class="item-header">
                    <span class="item-title">${escapeHTML(row.title)}</span>
                    <span class="item-type">${typeLabel}</span>
                </div>
                <div class="item-details">
                    ${row.username ? `<div>👤 ${escapeHTML(row.username)}</div>` : ''}
                    ${row.password ? `<div style="font-family:monospace; font-size:0.8rem;">••••••••</div>` : ''}
                </div>
                <div class="item-actions">
                    ${row.password ? `<button class="btn-icon" onclick="copyToClipboard('${escapeHTML(row.password)}', this)">📋</button>` : ''}
                    ${row.username ? `<button class="btn-icon" onclick="copyToClipboard('${escapeHTML(row.username)}', this)">👤</button>` : ''}
                    <button class="btn-icon" onclick="editEntry(${row.id})">✏️</button>
                    <button class="btn-icon" style="color:var(--danger-color)" onclick="deleteEntry(${row.id})">🗑️</button>
                </div>
            `;
            listContainer.appendChild(item);
        });

        // Attach global handlers for dynamic elements
        window.editEntry = editEntry;
        window.deleteEntry = deleteEntry;
        window.copyToClipboard = copyToClipboard;
    } catch (e) {
        console.error("Render Error:", e);
    }
}

async function editEntry(id) {
    const rows = await os.database.query(`SELECT * FROM credentials WHERE id = ?`, [id]);
    if (rows.length > 0) {
        const row = rows[0];
        editingId = id;
        document.getElementById('field-title').value = row.title;
        document.getElementById('field-type').value = row.type;
        document.getElementById('field-username').value = row.username || '';
        document.getElementById('field-password').value = row.password || '';
        document.getElementById('field-note').value = row.note || '';
        
        // Trigger change event to update visibility
        document.getElementById('editor-title').textContent = `Edit: ${row.title}`;
        document.getElementById('field-type').dispatchEvent(new Event('change'));
        switchView('editor');
    }
}

async function deleteEntry(id) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
        await os.database.run(`DELETE FROM credentials WHERE id = ?`, [id]);
        renderCredentials();
        os.notify("Deleted");
    } catch (e) {
        return;
    }
}

async function copyToClipboard(text, btn) {
    try {
        await os.clipboard.write(text);
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '✅';
        setTimeout(() => {
            btn.innerHTML = originalIcon;
        }, 2000);
    } catch (e) {
        os.notify("Clipboard error");
    }
}

function resetEditorForm() {
    document.getElementById('entry-form').reset();
    document.getElementById('editor-title').textContent = 'New Entry';
    const typeSelect = document.getElementById('field-type');
    typeSelect.dispatchEvent(new Event('change'));
}

function togglePasswordVisibility() {
    const input = document.getElementById('field-password');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
}

// Event Listeners for window/app lifecycle
window.addEventListener('load', init);