if (!window.os) {
    console.warn('Crypto Ticker requires one_OS environment');
}

const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd';
const FETCH_INTERVAL = 15000;

let lastPrices = {};
let lastUpdate = null;
let isFetching = false;

async function fetchPrices() {
    if (isFetching) return;
    isFetching = true;

    const refreshBtn = document.getElementById('refreshBtn');
    const messageZone = document.getElementById('messageZone');

    refreshBtn.disabled = true;
    messageZone.textContent = 'Fetching...';

    try {
        if (!window.os) {
            throw new Error('one_OS not available');
        }

        const response = await os.network.fetch(API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = JSON.parse(response.body);
        const newPrices = {
            bitcoin: data.bitcoin.usd,
            ethereum: data.ethereum.usd
        };

        updateDisplay(newPrices, lastPrices);

        await os.storage.set('lastPrices', newPrices);
        await os.storage.set('lastUpdate', new Date().toISOString());

        lastPrices = newPrices;
        lastUpdate = new Date().toISOString();
        messageZone.textContent = '';
    } catch (error) {
        messageZone.textContent = `Error: ${error.message}`;
        console.error('Fetch error:', error);
    } finally {
        refreshBtn.disabled = false;
        isFetching = false;
    }
}

function updateDisplay(newPrices, oldPrices) {
    const btcPrice = newPrices.bitcoin;
    const btcDirection = getDirection(oldPrices.bitcoin, btcPrice);
    updateCard('bitcoin', btcPrice, btcDirection);

    const ethPrice = newPrices.ethereum;
    const ethDirection = getDirection(oldPrices.ethereum, ethPrice);
    updateCard('ethereum', ethPrice, ethDirection);
}

function getDirection(oldPrice, newPrice) {
    if (!oldPrice) return 'neutral';
    if (newPrice > oldPrice) return 'up';
    if (newPrice < oldPrice) return 'down';
    return 'neutral';
}

function updateCard(crypto, price, direction) {
    const priceEl = document.getElementById(`${crypto}Price`);
    const indicatorEl = document.getElementById(`${crypto}Indicator`);
    const timeEl = document.getElementById(`${crypto}Time`);

    priceEl.textContent = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    indicatorEl.className = 'direction-indicator ' + direction;
    if (direction === 'up') {
        indicatorEl.textContent = '↑';
    } else if (direction === 'down') {
        indicatorEl.textContent = '↓';
    } else {
        indicatorEl.textContent = '—';
    }

    const time = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—';
    timeEl.textContent = `Updated: ${time}`;
}

async function initApp() {
    try {
        if (window.os) {
            const storedPrices = await os.storage.get('lastPrices');
            const storedUpdate = await os.storage.get('lastUpdate');

            if (storedPrices) {
                lastPrices = storedPrices;
                lastUpdate = storedUpdate;
                updateDisplay(storedPrices, {});
            }
        }
    } catch (error) {
        console.error('Storage error:', error);
    }

    document.getElementById('refreshBtn').addEventListener('click', fetchPrices);
    await fetchPrices();
    setInterval(fetchPrices, FETCH_INTERVAL);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
