// Matrix Rain Effect: https://codepen.io/pavelk2/pen/xbKAmP (adapted for overlay)
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = Array(256).join('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') .split('');
const fontSize = 16;
const columns = canvas.width / fontSize;

const drops = [];
for(let x = 0; x < columns; x++)
  drops[x] = 1;

function drawMatrix() {
  ctx.fillStyle = 'rgba(17,17,17,0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#39ff14';
  ctx.font = fontSize + 'px monospace';
  for(let i = 0; i < drops.length; i++) {
    const text = letters[Math.floor(Math.random()*letters.length)];
    ctx.fillText(text, i*fontSize, drops[i]*fontSize);
    if(drops[i]*fontSize > canvas.height && Math.random() > 0.95)
      drops[i] = 0;
    drops[i]++;
  }
}
setInterval(drawMatrix, 50);

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
