const os = window.os || null;

const THEMES = {
    classic: {
        name: 'Classic',
        white: '#e8d5b7',
        black: '#b58863',
        symbols: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔', P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' }
    },
    animals: {
        name: 'Animals',
        white: '#f0e6d2',
        black: '#a89968',
        symbols: { p: '🐑', n: '🦘', b: '🦊', r: '🦣', q: '🐯', k: '🦁', P: '🐘', N: '🦌', B: '🐶', R: '🦏', Q: '🐉', K: '🦅' }
    },
    neon: {
        name: 'Neon',
        white: '#00ff88',
        black: '#ff0088',
        symbols: { p: '◆', n: '◈', b: '□', r: '■', q: '●', k: '★', P: '▲', N: '▼', B: '◀', R: '▶', Q: '◈', K: '✦' }
    },
    ninjas: {
        name: 'Ninjas',
        white: '#c0c0c0',
        black: '#1a1a1a',
        symbols: { p: '🥋', n: '🗡', b: '🏹', r: '🔱', q: '⚔', k: '👤', P: '🎖', N: '🔰', B: '🎯', R: '⛩', Q: '🌪', K: '👹' }
    },
    vehicles: {
        name: 'Vehicles',
        white: '#ffeb3b',
        black: '#ff6b6b',
        symbols: { p: '🚗', n: '✈', b: '🚁', r: '🚀', q: '🛸', k: '🚂', P: '🏎', N: '🛩', B: '🚕', R: '🛩', Q: '🪂', K: '🚆' }
    }
};

class Piece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
    }

    clone() {
        const p = new Piece(this.type, this.color, this.row, this.col);
        p.hasMoved = this.hasMoved;
        return p;
    }

    getMoves(board) {
        const moves = [];
        const { row, col, type, color } = this;

        const add = (r, c) => {
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const target = board[r][c];
                if (!target || target.color !== color) moves.push([r, c]);
            }
        };

        const slide = (dirs) => {
            for (const [dr, dc] of dirs) {
                for (let i = 1; i < 8; i++) {
                    const r = row + dr * i, c = col + dc * i;
                    if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
                    const target = board[r][c];
                    if (!target) {
                        moves.push([r, c]);
                    } else {
                        if (target.color !== color) moves.push([r, c]);
                        break;
                    }
                }
            }
        };

        if (type === 'p') {
            const dir = color === 'white' ? -1 : 1;
            const start = color === 'white' ? 6 : 1;
            const r = row + dir;
            if (r >= 0 && r < 8 && !board[r][col]) {
                moves.push([r, col]);
                if (row === start && !board[r + dir][col]) moves.push([r + dir, col]);
            }
            for (const dc of [-1, 1]) {
                const nr = r, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    const t = board[nr][nc];
                    if (t && t.color !== color) moves.push([nr, nc]);
                }
            }
        } else if (type === 'n') {
            for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
                add(row + dr, col + dc);
            }
        } else if (type === 'b') {
            slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
        } else if (type === 'r') {
            slide([[-1,0],[1,0],[0,-1],[0,1]]);
        } else if (type === 'q') {
            slide([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
        } else if (type === 'k') {
            for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
                add(row + dr, col + dc);
            }
        }

        return moves;
    }
}

class Board {
    constructor() {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.history = [];
        this.captured = { white: [], black: [] };
        this._init();
    }

    _init() {
        const back = ['r','n','b','q','k','b','n','r'];
        for (let c = 0; c < 8; c++) {
            this.grid[0][c] = new Piece(back[c], 'black', 0, c);
            this.grid[1][c] = new Piece('p', 'black', 1, c);
            this.grid[6][c] = new Piece('p', 'white', 6, c);
            this.grid[7][c] = new Piece(back[c], 'white', 7, c);
        }
    }

    get(r, c) { return this.grid[r]?.[c] || null; }

    clone() {
        const b = new Board();
        b.grid = this.grid.map(r => r.map(p => p ? p.clone() : null));
        b.history = [...this.history];
        b.captured = { white: [...this.captured.white], black: [...this.captured.black] };
        return b;
    }

    move(fr, fc, tr, tc) {
        const piece = this.grid[fr][fc];
        const target = this.grid[tr][tc];
        if (target) this.captured[piece.color === 'white' ? 'black' : 'white'].push(target);
        piece.row = tr;
        piece.col = tc;
        piece.hasMoved = true;
        this.grid[tr][tc] = piece;
        this.grid[fr][fc] = null;
        this.history.push({ from: [fr, fc], to: [tr, tc], cap: target });
    }

    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.grid[r][c];
                if (p && p.type === 'k' && p.color === color) return [r, c];
            }
        }
        return null;
    }

    isCheckmate(color) {
        const king = this.findKing(color);
        return king === null;
    }

    getMoves(color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.grid[r][c];
                if (p && p.color === color) {
                    const pMoves = p.getMoves(this.grid);
                    for (const m of pMoves) {
                        moves.push({ from: [r, c], to: m });
                    }
                }
            }
        }
        return moves;
    }
}

class Camera {
    constructor() {
        this.yaw = 45;
        this.pitch = 30;
        this.distance = 600;
    }

    project(x, y, z, w, h) {
        const yaw = this.yaw * Math.PI / 180;
        const pitch = this.pitch * Math.PI / 180;

        let x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
        let z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
        let y1 = y;
        let z2 = z1 * Math.cos(pitch) - y1 * Math.sin(pitch);
        let y2 = z1 * Math.sin(pitch) + y1 * Math.cos(pitch);

        const scale = this.distance / (this.distance + z2);
        return {
            x: w / 2 + x1 * scale,
            y: h / 2 - y2 * scale,
            scale,
            z: z2
        };
    }

    raycast(sx, sy, w, h) {
        const invDist = 1 / this.distance;
        const yaw = this.yaw * Math.PI / 180;
        const pitch = this.pitch * Math.PI / 180;

        let nx = (sx - w / 2) * invDist;
        let ny = -(sy - h / 2) * invDist;

        let px = nx * Math.cos(yaw) + ny * Math.sin(pitch) * Math.sin(yaw);
        let py = ny * Math.cos(pitch);
        let pz = -nx * Math.sin(yaw) + ny * Math.sin(pitch) * Math.cos(yaw);

        return { x: px, y: py, z: pz };
    }
}

class Game {
    constructor(theme) {
        this.theme = theme;
        this.board = new Board();
        this.camera = new Camera();
        this.turn = 'white';
        this.selected = null;
        this.moves = [];
        this.over = false;
        this.paused = false;
        this.startTime = Date.now();
        this.animating = [];
        this.draggingPiece = null;
        this.dragStart = null;
        this.dragCurrentPos = null;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => this.mouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.mouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.mouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        this.loop();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pauseBtn').textContent = this.paused ? 'Resume' : 'Pause';
    }

    mouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        if (e.button === 2) {
            this.dragStart = { x: sx, y: sy, yaw: this.camera.yaw, pitch: this.camera.pitch };
        } else if (e.button === 0) {
            if (this.over || this.turn !== 'white' || this.paused) return;
            const sq = this.screenToSquare(sx, sy);
            if (sq) {
                const [r, c] = sq;
                const p = this.board.get(r, c);
                if (p && p.color === 'white') {
                    this.draggingPiece = [r, c];
                    this.dragCurrentPos = { x: sx, y: sy };
                    this.selected = [r, c];
                    this.moves = p.getMoves(this.board.grid);
                }
            }
        }
    }

    mouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        if (this.dragStart && e.buttons === 2) {
            const dx = sx - this.dragStart.x;
            const dy = sy - this.dragStart.y;
            this.camera.yaw = this.dragStart.yaw - dx * 0.5;
            this.camera.pitch = Math.max(-89, Math.min(89, this.dragStart.pitch + dy * 0.5));
        }

        if (this.draggingPiece && e.buttons === 1) {
            this.dragCurrentPos = { x: sx, y: sy };
        }
    }

    mouseUp(e) {
        if (e.button === 2) {
            this.dragStart = null;
        } else if (e.button === 0 && this.draggingPiece) {
            const rect = this.canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const targetSq = this.screenToSquare(sx, sy);

            if (targetSq) {
                const [tr, tc] = targetSq;
                const [fr, fc] = this.draggingPiece;

                if (this.moves.some(m => m[0] === tr && m[1] === tc)) {
                    this.doMove(fr, fc, tr, tc);
                    this.selected = null;
                    this.moves = [];
                    setTimeout(() => this.aiMove(), 600);
                }
            }

            this.draggingPiece = null;
            this.dragCurrentPos = null;
        }
    }

    screenToSquare(sx, sy) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const pos = this.getSquarePos(r, c);
                if (Math.hypot(pos.x - sx, pos.y - sy) < 25) return [r, c];
            }
        }
        return null;
    }

    getSquarePos(r, c) {
        const x = (c - 3.5) * 50;
        const z = (r - 3.5) * 50;
        return this.camera.project(x, 0, z, this.canvas.width, this.canvas.height);
    }

    doMove(fr, fc, tr, tc) {
        const piece = this.board.get(fr, fc);
        const target = this.board.get(tr, tc);

        this.board.move(fr, fc, tr, tc);
        if (target && target.type === 'k') {
            this.gameWin('white');
            return;
        }

        this.turn = 'black';
    }

    aiMove() {
        if (this.over || this.turn !== 'black' || this.paused) return;
        const moves = this.board.getMoves('black');
        if (!moves.length) { this.gameWin('white'); return; }

        let best = moves[0];
        let bestScore = -Infinity;

        for (const move of moves) {
            const b = this.board.clone();
            b.move(move.from[0], move.from[1], move.to[0], move.to[1]);
            const score = this.eval(b);
            if (score > bestScore) {
                bestScore = score;
                best = move;
            }
        }

        const [fr, fc] = best.from;
        const [tr, tc] = best.to;
        const target = this.board.get(tr, tc);

        this.board.move(fr, fc, tr, tc);
        if (target && target.type === 'k') {
            this.gameWin('black');
            return;
        }

        this.turn = 'white';
    }

    minimax(board, depth, isMax) {
        if (depth === 0) return this.eval(board);
        const moves = board.getMoves(isMax ? 'black' : 'white');
        if (!moves.length) return isMax ? -1000 : 1000;

        let score = isMax ? -Infinity : Infinity;
        for (const move of moves) {
            const b = board.clone();
            b.move(move.from[0], move.from[1], move.to[0], move.to[1]);
            const s = this.minimax(b, depth - 1, !isMax);
            score = isMax ? Math.max(score, s) : Math.min(score, s);
        }
        return score;
    }

    eval(board) {
        const vals = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board.grid[r][c];
                if (p) score += (p.color === 'black' ? 1 : -1) * (vals[p.type] || 0);
            }
        }
        return score;
    }

    gameWin(color) {
        this.over = true;
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('victoryScreen').style.display = 'flex';
        document.getElementById('victoryText').textContent = (color === 'white' ? 'White' : 'Black') + ' Wins!';
        this.drawVictory();
    }

    drawVictory() {
        const canvas = document.getElementById('victoryCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((Date.now() % 4000) / 4000 * Math.PI * 2);
        ctx.fillText('♔', 0, 0);
        ctx.restore();
    }

    loop() {
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    render() {
        const w = this.canvas.width, h = this.canvas.height;
        this.ctx.fillStyle = 'rgba(15, 52, 96, 0.8)';
        this.ctx.fillRect(0, 0, w, h);

        let pieces = [];

        // Collect all pieces with depth for sorting
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board.get(r, c);
                if (p) {
                    const pos = this.getSquarePos(r, c);
                    const sym = THEMES[this.theme].symbols[p.type + (p.color === 'white' ? '' : '').toUpperCase()];
                    pieces.push({ r, c, p, pos, sym, z: pos.z, dragging: false });
                }
            }
        }

        // Handle dragging piece
        let draggedPiece = null;
        if (this.draggingPiece) {
            const [dr, dc] = this.draggingPiece;
            const p = this.board.get(dr, dc);
            if (p) {
                const sym = THEMES[this.theme].symbols[p.type + (p.color === 'white' ? '' : '').toUpperCase()];
                draggedPiece = { r: dr, c: dc, p, pos: this.dragCurrentPos, sym, z: 999, dragging: true };
                pieces = pieces.filter(x => !(x.r === dr && x.c === dc));
            }
        }

        // Sort by depth (painter's algorithm)
        pieces.sort((a, b) => a.z - b.z);
        if (draggedPiece) pieces.push(draggedPiece);

        // Draw board squares
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const dark = (r + c) % 2 === 1;
                const color = dark ? THEMES[this.theme].black : THEMES[this.theme].white;
                const pos = this.getSquarePos(r, c);
                const sz = Math.max(15, 40 * pos.scale);

                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = 0.65;
                this.ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);

                if (this.selected && this.selected[0] === r && this.selected[1] === c) {
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
                }

                if (this.moves.some(m => m[0] === r && m[1] === c)) {
                    this.ctx.fillStyle = '#4ade80';
                    this.ctx.globalAlpha = 0.35;
                    this.ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);
                }

                this.ctx.globalAlpha = 1;
            }
        }

        // Draw pieces with 3D effect
        for (const piece of pieces) {
            const { pos, sym, p, dragging } = piece;
            const sz = Math.max(18, 32 * pos.scale);

            // Draw cube shadow/base
            this.ctx.fillStyle = dragging ? 'rgba(100, 150, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(pos.x - sz / 2, pos.y - sz / 2, sz, sz);

            // Draw piece symbol
            this.ctx.font = `bold ${sz * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = p.color === 'white' ? '#fff' : '#000';
            this.ctx.fillText(sym, pos.x, pos.y);

            // Draw highlight border for dragging
            if (dragging) {
                this.ctx.strokeStyle = '#4db8ff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(pos.x - sz / 2 - 2, pos.y - sz / 2 - 2, sz + 4, sz + 4);
            }
        }

        this.updateUI();
    }

    updateUI() {
        if (!this.paused) {
            const t = Math.floor((Date.now() - this.startTime) / 1000);
            const m = Math.floor(t / 60), s = t % 60;
            document.getElementById('timer').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        }

        document.getElementById('turnBlock').textContent = (this.turn === 'white' ? '♔' : '♚') + ' ' + (this.turn === 'white' ? 'White' : 'Black') + "'s Turn";

        const cap = [...this.board.captured.white, ...this.board.captured.black]
            .map(p => THEMES[this.theme].symbols[p.type + (p.color === 'white' ? '' : '').toUpperCase()])
            .map(s => `<div class="captured-piece">${s}</div>`)
            .join('');
        document.getElementById('capturedList').innerHTML = cap || '<div style="color:#555;font-size:0.8rem;">None yet</div>';

        const moves = this.board.history.map((m, i) => `<div class="move-entry">${i + 1}. ${String.fromCharCode(97 + m.from[1])}${8-m.from[0]}→${String.fromCharCode(97+m.to[1])}${8-m.to[0]}</div>`).join('');
        document.getElementById('moveList').innerHTML = moves || '<div style="color:#555;font-size:0.8rem;">No moves</div>';
    }
}

let game = null;

function showMenu() {
    document.getElementById('menuScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';

    const grid = document.getElementById('themeGrid');
    grid.innerHTML = '';
    for (const [key, theme] of Object.entries(THEMES)) {
        const btn = document.createElement('button');
        btn.className = 'theme-btn';
        btn.textContent = theme.name;
        btn.onclick = () => startGame(key);
        grid.appendChild(btn);
    }
}

function startGame(theme) {
    game = new Game(theme);
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    if (os) os.window.setTitle('Battle Chess 3D - ' + THEMES[theme].name);
}

document.addEventListener('DOMContentLoaded', () => {
    showMenu();
    document.getElementById('newGameBtn').addEventListener('click', showMenu);
});
