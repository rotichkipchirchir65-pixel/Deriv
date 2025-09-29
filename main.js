const chartContainer = document.getElementById('chart');
let chart, candleSeries;
let currentAsset = 'R_50';
let currentTimeframe = '1m';
let ws;
let priceHistory = [];
let barrierPrice = null;

function setupChart() {
  chartContainer.innerHTML = '';
  chart = LightweightCharts.createChart(chartContainer, {
    layout: { background: { color: '#111' }, textColor: '#39ff14' },
    grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
    crosshair: { mode: 1 },
    timeScale: { timeVisible: true, secondsVisible: true },
  });
  candleSeries = chart.addCandlestickSeries({ upColor: '#39ff14', downColor: '#ff3c3c', borderVisible: false });
}

function connectWS(asset) {
  if (ws) ws.close();
  ws = new WebSocket('wss://ws.deriv.com/websockets/v3?app_id=1089');
  ws.onopen = () => {
    ws.send(JSON.stringify({ ticks_history: asset, count: 100, end: 'latest', style: 'candles', granularity: granularityFromTF(currentTimeframe) }));
    ws.send(JSON.stringify({ ticks: asset, subscribe: 1 }));
  };
  ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    if (data.history) {
      priceHistory = data.history.candles;
      drawCandles(priceHistory);
    }
    if (data.tick) {
      handleTick(data.tick);
    }
  };
}

function drawCandles(candles) {
  const formatted = candles.map(c => ({
    time: c.epoch,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
  candleSeries.setData(formatted);
}

function handleTick(tick) {
  const newPrice = { epoch: tick.epoch, quote: tick.quote };
  priceHistory.push({ ...newPrice, open: tick.quote, high: tick.quote, low: tick.quote, close: tick.quote });
  if (priceHistory.length > 100) priceHistory.shift();
  candleSeries.update({ time: tick.epoch, open: tick.quote, high: tick.quote, low: tick.quote, close: tick.quote });
  runSignals();
}

function runSignals() {
  const barrier = parseFloat(document.getElementById('barrier').value);
  if (!barrier) return;
  const signals = detectSignals(priceHistory, barrier);
  const predictive = predictiveAlert(priceHistory, barrier);
  let alerts = '';
  signals.forEach(s => {
    alerts += `<div class="neon">${s.type.toUpperCase()} @ ${new Date(s.time*1000).toLocaleTimeString()}</div>`;
  });
  if (predictive) {
    alerts += `<div class="neon blink">ALERT: Possible cross in ${predictive.eta.toFixed(1)}s!</div>`;
  }
  document.getElementById('signal-alerts').innerHTML = alerts;
}

function detectSignals(prices, barrier) {
  let signals = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1].close < barrier && prices[i].close > barrier) {
      signals.push({type: 'buy', time: prices[i].epoch});
    }
    if (prices[i-1].close > barrier && prices[i].close < barrier) {
      signals.push({type: 'sell', time: prices[i].epoch});
    }
  }
  return signals;
}

function predictiveAlert(prices, barrier) {
  if (prices.length < 2) return null;
  const last = prices[prices.length-1];
  const prev = prices[prices.length-2];
  const velocity = (last.close - prev.close) / (last.epoch - prev.epoch); // price/sec
  const timeToBarrier = (barrier - last.close) / velocity;
  if (timeToBarrier > 0 && timeToBarrier <= 3) {
    return { alert: 'crossing soon', eta: timeToBarrier };
  }
  return null;
}

function granularityFromTF(tf) {
  switch (tf) {
    case '1m': return 60;
    case '5m': return 300;
    case '1h': return 3600;
    default: return 60;
  }
}

function zoomChart(dir) {
  const scale = chart.timeScale();
  dir === 'in' ? scale.zoomIn() : scale.zoomOut();
}

document.getElementById('asset-switch').onchange = e => {
  currentAsset = e.target.value;
  setupChart();
  connectWS(currentAsset);
};
document.getElementById('timeframe').onchange = e => {
  currentTimeframe = e.target.value;
  setupChart();
  connectWS(currentAsset);
};
document.getElementById('barrier').oninput = runSignals;

setupChart();
connectWS(currentAsset);
