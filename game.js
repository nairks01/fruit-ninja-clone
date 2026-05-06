const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

let score = 0;
let combo = 0;
let gameRunning = true;
let bombs = 0;
let misses = 0;
let maxMisses = 3;

const fruits = [];
const particles = [];
const slashes = [];

const fruitTypes = [
    { name: 'apple', color: '#e74c3c', radius: 15 },
    { name: 'banana', color: '#f1c40f', radius: 15 },
    { name: 'orange', color: '#e67e22', radius: 15 },
    { name: 'watermelon', color: '#2ecc71', radius: 15 },
    { name: 'grape', color: '#9b59b6', radius: 12 }
];

const bombType = { name: 'bomb', color: '#2c3e50', radius: 15 };

class Fruit {
    constructor(x, y, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.radius = type.radius;
        this.sliced = false;
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
    }

    update() {
        if (this.sliced) return;

        this.vy += 0.3;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.y > canvas.height + 50 || this.x < -50 || this.x > canvas.width + 50) {
            return false;
        }
        return true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    contains(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy < this.radius * this.radius;
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = 4;
    }

    update() {
        this.vy += 0.2;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        return this.life > 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class Slash {
    constructor(x, y) {
        this.points = [{ x, y }];
        this.life = 15;
        this.maxLife = 15;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
    }

    update() {
        this.life--;
        return this.life > 0;
    }

    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (this.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}

let mouseDown = false;
let lastX = 0;
let lastY = 0;

document.addEventListener('mousedown', (e) => {
    if (!gameRunning) return;
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
});

document.addEventListener('mousemove', (e) => {
    if (!gameRunning || !mouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    checkSlice(x, y);
    lastX = x;
    lastY = y;
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

function checkSlice(x, y) {
    const slash = new Slash(lastX, lastY);
    slash.addPoint(x, y);
    slashes.push(slash);

    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        if (!fruit.sliced && isPointNearLine(fruit.x, fruit.y, lastX, lastY, x, y, fruit.radius)) {
            sliceFruit(fruit, x, y);
        }
    }
}

function isPointNearLine(px, py, x1, y1, x2, y2, distance) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return dx * dx + dy * dy < distance * distance;
}

function sliceFruit(fruit, x, y) {
    fruit.sliced = true;
    combo++;

    if (fruit.type === bombType) {
        createExplosion(fruit.x, fruit.y, '#ff4444');
        gameOver();
        return;
    }

    score += combo * 10;
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;

    showComboDisplay(combo, x, y);

    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const vx = Math.cos(angle) * 6;
        const vy = Math.sin(angle) * 6 - 3;
        particles.push(new Particle(fruit.x, fruit.y, vx, vy, fruit.type.color, 40));
    }

    if (combo >= 5) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * 4;
            const vy = Math.sin(angle) * 4;
            particles.push(new Particle(x, y, vx, vy, '#FFD700', 30));
        }
    }

    setTimeout(() => {
        const index = fruits.indexOf(fruit);
        if (index > -1) {
            fruits.splice(index, 1);
        }
    }, 100);
}

function showComboDisplay(comboCount, x, y) {
    const display = document.getElementById('comboDisplay');
    let text = comboCount + 'x';

    if (comboCount >= 10) {
        text = '🔥 ' + comboCount + 'x 🔥';
    } else if (comboCount >= 5) {
        text = '✨ ' + comboCount + 'x';
    }

    display.textContent = text;
    display.classList.remove('show');
    void display.offsetWidth;
    display.classList.add('show');
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const vx = Math.cos(angle) * 8;
        const vy = Math.sin(angle) * 8 - 4;
        particles.push(new Particle(x, y, vx, vy, color, 50));
    }
}

function spawnFruit() {
    const isBomb = Math.random() < 0.1;
    const type = isBomb ? bombType : fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

    const x = Math.random() * (canvas.width - 60) + 30;
    const y = canvas.height;
    const angle = Math.PI / 3 + Math.random() * (Math.PI / 3);
    const speed = 14 + Math.random() * 4;
    let vx = Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed;

    vx = Math.max(-4, Math.min(4, vx));

    fruits.push(new Fruit(x, y, vx, vy, type));
}

let spawnRate = 60;
let spawnCounter = 0;

function update() {
    spawnCounter++;
    if (spawnCounter >= spawnRate) {
        spawnFruit();
        spawnCounter = 0;
        spawnRate = Math.max(20, spawnRate - 2);
    }

    for (let i = fruits.length - 1; i >= 0; i--) {
        if (!fruits[i].update()) {
            if (!fruits[i].sliced) {
                misses++;
                combo = 0;
                document.getElementById('combo').textContent = '0';
                if (misses >= maxMisses) {
                    gameOver();
                } else {
                    document.getElementById('lives').textContent = maxMisses - misses;
                }
            }
            fruits.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }

    for (let i = slashes.length - 1; i >= 0; i--) {
        if (!slashes[i].update()) {
            slashes.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fruits.forEach(fruit => fruit.draw());
    particles.forEach(particle => particle.draw());
    slashes.forEach(slash => slash.draw());
}

function gameLoop() {
    if (gameRunning) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.add('show');
}

function restartGame() {
    score = 0;
    combo = 0;
    misses = 0;
    gameRunning = true;
    fruits.length = 0;
    particles.length = 0;
    slashes.length = 0;
    spawnRate = 60;
    spawnCounter = 0;

    document.getElementById('score').textContent = '0';
    document.getElementById('combo').textContent = '0';
    document.getElementById('lives').textContent = '3';
    document.getElementById('gameOverScreen').classList.remove('show');
}

gameLoop();
