// --- Timer & Hourglass Logic ---
const DURATION = 20;
let timeLeft = DURATION;

const timerDisplay = document.getElementById('timer-display');
const sandTop = document.getElementById('sandTop');
const sandBottom = document.getElementById('sandBottom');
const hourglass = document.getElementById('hourglass');
const sandStream = document.getElementById('sandStream');
const statusMessage = document.getElementById('status-message');

function updateTimer() {
    // Update Text
    timerDisplay.innerText = timeLeft < 10 ? `0${timeLeft}` : timeLeft;

    // Update Hourglass Sand Heights
    const percentage = (timeLeft / DURATION) * 100;
    sandTop.style.height = `${percentage}%`;
    sandBottom.style.height = `${100 - percentage}%`;

    // Stream logic (only flow if time > 0 and less than max)
    if (timeLeft > 0 && timeLeft < DURATION) {
        sandStream.classList.add('flowing');
    } else {
        sandStream.classList.remove('flowing');
    }

    timeLeft--;

    if (timeLeft < 0) {
        resetTimer();
    }
}

function showMessage() {
    // Show Message
    statusMessage.classList.remove('opacity-0');
    statusMessage.classList.add('toast-enter-active');
    
    // Hide after 1.5 seconds (1500ms)
    setTimeout(() => {
        statusMessage.classList.add('opacity-0');
        statusMessage.classList.remove('toast-enter-active');
    }, 1500); 
}

function resetTimer() {
    // Show the popup message
    showMessage();

    // Flip Animation
    hourglass.style.transform = 'rotate(180deg)';
    
    setTimeout(() => {
        // Reset internal state
        timeLeft = DURATION;
        
        // Temporarily disable transition for instant reset
        sandTop.style.transition = 'none';
        sandBottom.style.transition = 'none';
        
        // Flip back instantly logic
        hourglass.style.transition = 'none';
        hourglass.style.transform = 'rotate(0deg)';
        
        // Reset sand
        sandTop.style.height = '100%';
        sandBottom.style.height = '0%';
        
        // Force reflow
        void hourglass.offsetWidth;
        
        // Restore transitions
        hourglass.style.transition = 'transform 0.5s ease-in-out';
        sandTop.style.transition = 'height 1s linear';
        sandBottom.style.transition = 'height 1s linear';
        
        updateTimer(); // Restart immediately
    }, 500);
}

// Init Timer
setInterval(updateTimer, 1000);
updateTimer();

// --- Background & Missile Animation (Canvas) ---
const canvas = document.getElementById('missileCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let missiles = [];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

class Missile {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = height + 10;
        this.speed = Math.random() * 2 + 1;
        this.angle = (Math.random() * 0.2 - 0.1) - Math.PI / 2; // Mostly upwards
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.trail = [];
        this.maxLength = 20 + Math.random() * 30;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxLength) {
            this.trail.shift();
        }

        if (this.y < -50) {
            this.reset();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 100, 100, ${this.opacity})`;
        ctx.lineWidth = 2;
        
        if (this.trail.length > 1) {
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
        }
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, 2, 2);
    }
}

// Initialize Missiles
for (let i = 0; i < 15; i++) {
    missiles.push(new Missile());
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle grid
    ctx.strokeStyle = 'rgba(20, 100, 50, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<width; x+=100) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
    for(let y=0; y<height; y+=100) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
    ctx.stroke();

    missiles.forEach(m => {
        m.update();
        m.draw();
    });
    requestAnimationFrame(animate);
}
animate();

// --- Target Locations (HTML Overlays) ---
const locations = [
    { name: "תל אביב", lat: "32.08", lon: "34.78" },
    { name: "הקריה", lat: "32.07", lon: "34.79" },
    { name: "חיפה", lat: "32.79", lon: "34.98" },
    { name: "דימונה", lat: "31.06", lon: "35.03" },
    { name: "ירושלים", lat: "31.76", lon: "35.21" },
    { name: "נתב״ג", lat: "32.00", lon: "34.87" }
];

const targetsLayer = document.getElementById('targets-layer');

function spawnTarget() {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const el = document.createElement('div');
    
    const top = Math.random() * 80 + 10;
    const left = Math.random() * 80 + 10;
    
    el.className = 'absolute flex flex-col items-center justify-center text-red-500 opacity-0 transition-opacity duration-500';
    el.style.top = top + '%';
    el.style.left = left + '%';
    el.innerHTML = `
        <div class="relative">
            <div class="w-8 h-8 border border-red-500 rounded-full flex items-center justify-center animate-ping absolute"></div>
            <div class="w-8 h-8 border border-red-500 rounded-full flex items-center justify-center">
                <div class="w-1 h-1 bg-red-500"></div>
            </div>
        </div>
        <div class="mt-1 text-[10px] bg-black/50 px-1 font-mono blink whitespace-nowrap">
            ${loc.name} [${loc.lat}, ${loc.lon}]
        </div>
    `;
    
    targetsLayer.appendChild(el);
    requestAnimationFrame(() => { el.classList.remove('opacity-0'); });

    setTimeout(() => {
        el.classList.add('opacity-0');
        setTimeout(() => el.remove(), 500);
    }, 3000 + Math.random() * 2000);
}

setInterval(spawnTarget, 2500);
spawnTarget();

setInterval(() => {
    const lat = (31 + Math.random() * 2).toFixed(4);
    const lon = (34 + Math.random() * 1).toFixed(4);
    document.getElementById('random-coords').innerText = `${lat}° N, ${lon}° E`;
}, 200);
