const app = {
  socket: null,
  updates: [],
  maxUpdates: 20,
  prices: {},
  status: 'connecting',
  reconnectAttempt: 0,
  maxReconnectAttempts: 10,
  baseReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectTimer: null,
  updateInterval: null,

  async init() {
    if (!window.os) {
      this.setStatus('disconnected');
      document.getElementById('tradesList').innerHTML =
        '<div class="empty-state">Running outside one_OS — network access unavailable</div>';
      return;
    }

    this.bindEvents();
    this.connect();
    this.startTimeUpdater();
  },

  bindEvents() {
    const reconnectBtn = document.getElementById('reconnectBtn');
    if (reconnectBtn) {
      reconnectBtn.addEventListener('click', () => this.reconnect());
    }
  },

  async connect() {
    if (this.socket) return;

    this.setStatus('connecting');
    const reconnectBtn = document.getElementById('reconnectBtn');
    if (reconnectBtn) reconnectBtn.disabled = true;

    try {
      this.socket = await window.os.network.socket('wss://ws.coincap.io/prices?assets=bitcoin,ethereum');

      this.socket.onMessage(({ data }) => {
        try {
          const priceData = JSON.parse(data);
          this.processPriceUpdate(priceData);
        } catch (e) {
          console.error('Failed to parse price data:', e);
        }
      });

      this.socket.onClose(() => {
        this.socket = null;
        this.setStatus('disconnected');
        this.scheduleReconnect();
      });

      this.socket.onError(({ error }) => {
        console.error('Socket error:', error);
        this.socket = null;
        this.setStatus('disconnected');
        this.scheduleReconnect();
      });

      this.reconnectAttempt = 0;
      this.setStatus('connected');
      if (reconnectBtn) reconnectBtn.disabled = false;
    } catch (error) {
      console.error('Connection failed:', error);
      this.socket = null;
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  },

  processPriceUpdate(priceData) {
    for (const [asset, priceStr] of Object.entries(priceData)) {
      const price = parseFloat(priceStr);

      if (!this.prices[asset]) {
        this.prices[asset] = { current: price, previous: price };
      }

      const isUp = price > this.prices[asset].current;

      const update = {
        asset: asset.charAt(0).toUpperCase() + asset.slice(1),
        price: price,
        isUp: isUp,
        timestamp: Date.now()
      };

      this.updates.unshift(update);
      if (this.updates.length > this.maxUpdates) {
        this.updates.pop();
      }

      this.prices[asset] = { current: price, previous: this.prices[asset].current };
    }

    this.render();
  },

  scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.setStatus('disconnected');
      const reconnectBtn = document.getElementById('reconnectBtn');
      if (reconnectBtn) reconnectBtn.disabled = false;
      return;
    }

    this.reconnectAttempt++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      this.maxReconnectDelay
    );

    if (window.os && window.os.storage) {
      window.os.storage.set('reconnectAttempt', this.reconnectAttempt).catch(() => {});
    }

    this.setStatus('connecting');
    const reconnectBtn = document.getElementById('reconnectBtn');
    if (reconnectBtn) reconnectBtn.disabled = true;

    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  },

  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempt = 0;
    this.connect();
  },

  setStatus(status) {
    this.status = status;
    const badge = document.getElementById('statusBadge');
    const text = document.getElementById('statusText');

    if (!badge || !text) return;

    badge.className = `status-badge ${status}`;
    switch (status) {
      case 'connected':
        text.textContent = 'Connected';
        break;
      case 'connecting':
        text.textContent = 'Connecting...';
        break;
      case 'disconnected':
        text.textContent = 'Disconnected';
        break;
    }
  },

  startTimeUpdater() {
    this.updateInterval = setInterval(() => {
      if (this.updates.length > 0) {
        this.render();
      }
    }, 1000);
  },

  getRelativeTime(timestamp) {
    const now = Date.now();
    const elapsed = now - timestamp;
    const seconds = Math.floor(elapsed / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  formatPrice(price) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  formatQuantity(qty) {
    if (qty >= 1) {
      return qty.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
    }
    return qty.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8
    });
  },

  render() {
    const container = document.getElementById('tradesList');
    if (!container) return;

    if (this.updates.length === 0) {
      container.innerHTML = '<div class="empty-state">Waiting for price updates...</div>';
      return;
    }

    container.innerHTML = this.updates.map(update => {
      const direction = update.isUp ? 'up' : 'down';
      const arrowSymbol = update.isUp ? '▲' : '▼';

      return `
        <div class="trade-row ${direction}">
          <div class="trade-asset">${update.asset}</div>
          <div class="trade-price">$${this.formatPrice(update.price)}</div>
          <div class="trade-time">${this.getRelativeTime(update.timestamp)}</div>
          <div class="trade-indicator ${direction}">${arrowSymbol}</div>
        </div>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
