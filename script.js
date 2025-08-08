// DOM 요소 가져오기
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');
const restartButton = document.getElementById('restartButton');
const resetSizeButton = document.getElementById('resetSizeButton');
const helpButton = document.getElementById('helpButton');
const shareButton = document.getElementById('shareButton');

// Keyboard controls
const qButton = document.getElementById('qButton');
const eButton = document.getElementById('eButton');
const rollback1_left = document.getElementById('rollback1_left');
const rollback2_left = document.getElementById('rollback2_left');
const rollback3_left = document.getElementById('rollback3_left');
const rollback4_left = document.getElementById('rollback4_left');
const rollback1_right = document.getElementById('rollback1_right');
const rollback2_right = document.getElementById('rollback2_right');
const rollback3_right = document.getElementById('rollback3_right');
const rollback4_right = document.getElementById('rollback4_right');

// Joystick controls
const qButton_joystick = document.getElementById('qButton_joystick');
const eButton_joystick = document.getElementById('eButton_joystick');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');
const rollback1_joystick = document.getElementById('rollback1_joystick');
const rollback2_joystick = document.getElementById('rollback2_joystick');
const rollback3_joystick = document.getElementById('rollback3_joystick');
const rollback4_joystick = document.getElementById('rollback4_joystick');


// 시작 화면 요소
const startScreenModal = document.getElementById('startScreenModal');
const mainLayout = document.querySelector('.main-layout');
const controlModeContainer = document.getElementById('controlModeContainer');
const ageButtonsContainer = document.getElementById('ageButtonsContainer');
const customSizeBtn = document.getElementById('customSizeBtn');
const customSizeContainer = document.getElementById('customSizeContainer');
const mazeWidthSelect = document.getElementById('mazeWidthSelect');
const mazeHeightSelect = document.getElementById('mazeHeightSelect');
const startButton = document.getElementById('startButton');

// 승리 화면 요소
const winModal = document.getElementById('winModal');
const winTimeMessage = document.getElementById('winTimeMessage');
const winMazeSizeMessage = document.getElementById('winMazeSizeMessage');
const winRestartButton = document.getElementById('winRestartButton');
const winEmoji = document.getElementById('winEmoji');

// 도움말 모달 요소
const helpModal = document.getElementById('helpModal');
const closeHelpModalButton = document.getElementById('closeHelpModalButton');

// 스크린샷 모달 요소
const screenshotModal = document.getElementById('screenshotModal');
const screenshotImage = document.getElementById('screenshotImage');
const closeScreenshotModalButton = document.getElementById('closeScreenshotModalButton');
const flashOverlay = document.getElementById('flashOverlay');

// 게임 상태 변수
let TILE_SIZE = 40;
let MAZE_WIDTH = 11;
let MAZE_HEIGHT = 11;
let controlMode = 'keyboard';

let maze = [];
let player = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };
let endPos = { x: 0, y: 0 };

let startTime;
let timerInterval;
let gameWon = false;
let eButtonUsed = false;
let qButtonUsed = false;
let playerPath = [];
const MAX_PLAYER_PATH = 200;
let eButtonClearInterval = null;
let eButtonPathColor = '';

// Animation variables
let animationFrameId;
let flagYOffset = 0;
let flagAnimationTime = 0;
const flagFrames = ['🚩'];
const playerSprite = '🐎';

// Rollback feature saved positions
let savedPositions = { '1': null, '2': null, '3': null, '4': null };

// Continuous move variables
var moveIntervals = {};

// Joystick variables
let isJoystickActive = false;
let joystickInitialTimeout = null;
let joystickRepeatInterval = null;
let joystickDx = 0;
let joystickDy = 0;
const JOYSTICK_INITIAL_DELAY = 300;
const JOYSTICK_REPEAT_DELAY = 200;

// Tone.js sound settings
let runningSynth, rollbackSynth, impactSynth, qButtonSynth, eButtonSynth, shutterSynth;
let audioContextResumed = false;
const runningNotes = ["C4", "E4", "G4", "C5"];
let currentRunningNoteIndex = 0;

// --- Start Screen Logic ---
function populateSizeDropdowns() {
    mazeWidthSelect.innerHTML = '';
    mazeHeightSelect.innerHTML = '';
    const sizes = [33, 45, 57, 69, 81, 93, 105, 117];
    sizes.forEach(size => {
        const optionWidth = document.createElement('option');
        optionWidth.value = size;
        optionWidth.textContent = `${size}`;
        mazeWidthSelect.appendChild(optionWidth);

        const optionHeight = document.createElement('option');
        optionHeight.value = size;
        optionHeight.textContent = `${size}`;
        mazeHeightSelect.appendChild(optionHeight);
    });
}

function startGameWithSize(width, height) {
    MAZE_WIDTH = width;
    MAZE_HEIGHT = height;
    mainLayout.classList.remove('mode-keyboard', 'mode-joystick');
    mainLayout.classList.add(`mode-${controlMode}`);
    startScreenModal.style.display = 'none';
    mainLayout.style.display = 'flex';
    initGame();
}

controlModeContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('control-mode-button')) {
        controlMode = e.target.dataset.mode;
        document.querySelectorAll('.control-mode-button').forEach(btn => {
            btn.style.backgroundColor = '#BDECB6';
        });
        e.target.style.backgroundColor = '#4F46E5';
    }
});

ageButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('age-button')) {
        const size = parseInt(e.target.dataset.size);
        startGameWithSize(size, size);
    }
});

customSizeBtn.addEventListener('click', () => {
    ageButtonsContainer.parentElement.classList.add('hidden');
    customSizeContainer.classList.remove('hidden');
});

startButton.addEventListener('click', () => {
    const width = parseInt(mazeWidthSelect.value);
    const height = parseInt(mazeHeightSelect.value);
    startGameWithSize(width, height);
});


// --- Sound & Color Functions ---
function getRandomTransparentColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

function getRandomSolidColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

function initAudio() {
    runningSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    rollbackSynth = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.2 } }).toDestination();
    impactSynth = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 1, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.6 }, oscillator: { type: "sine" } }).toDestination();
    qButtonSynth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    eButtonSynth = new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.15 } }).toDestination();
    shutterSynth = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();

    document.documentElement.addEventListener('mousedown', () => {
        if (!audioContextResumed) {
            Tone.start();
            audioContextResumed = true;
        }
    }, { once: true });
}

function playRunningSound() { if (audioContextResumed) { runningSynth.triggerAttackRelease(runningNotes[currentRunningNoteIndex], "16n"); currentRunningNoteIndex = (currentRunningNoteIndex + 1) % runningNotes.length; } }
function playRollbackSound() { if (audioContextResumed) rollbackSynth.triggerAttackRelease("G5", "16n"); }
function playImpactSound() { if (audioContextResumed) { impactSynth.triggerAttackRelease("C1", "8n"); setTimeout(() => impactSynth.triggerAttackRelease("G1", "8n"), 200); } }
function playQButtonSound() { if (audioContextResumed) qButtonSynth.triggerAttackRelease("A4", "8n"); }
function playEButtonSound() { if (audioContextResumed) eButtonSynth.triggerAttackRelease("F4", "8n"); }
function playShutterSound() { if (audioContextResumed) shutterSynth.triggerAttackRelease("8n"); }


// --- Game Initialization and Drawing ---
function initializeCanvasSize() {
    const minTileSize = 5;
    const maxTileSize = 15;
    const headerElement = document.querySelector('.game-header');
    if (!headerElement) return;
    const headerStyle = window.getComputedStyle(headerElement);
    const availableWidth = headerElement.clientWidth - parseFloat(headerStyle.paddingLeft) - parseFloat(headerStyle.paddingRight);
    const availableHeight = headerElement.clientHeight - parseFloat(headerStyle.paddingTop) - parseFloat(headerStyle.paddingBottom);
    TILE_SIZE = Math.min(Math.floor(availableHeight / MAZE_HEIGHT), Math.floor(availableWidth / MAZE_WIDTH));
    TILE_SIZE = Math.max(minTileSize, Math.min(TILE_SIZE, maxTileSize));
    canvas.width = MAZE_WIDTH * TILE_SIZE;
    canvas.height = MAZE_HEIGHT * TILE_SIZE;
}

function generateMaze() {
    const pathSize = 3, wallSize = 1, step = pathSize + wallSize;
    maze = Array(MAZE_HEIGHT).fill(0).map(() => Array(MAZE_WIDTH).fill(1));
    const metaWidth = Math.floor((MAZE_WIDTH - wallSize) / step);
    const metaHeight = Math.floor((MAZE_HEIGHT - wallSize) / step);
    if (metaWidth <= 0 || metaHeight <= 0) { maze = Array(MAZE_HEIGHT).fill(0).map(() => Array(MAZE_WIDTH).fill(0)); return; }
    let metaVisited = Array(metaHeight).fill(0).map(() => Array(metaWidth).fill(false));
    let stack = [{ x: Math.floor(Math.random() * metaWidth), y: Math.floor(Math.random() * metaHeight) }];
    metaVisited[stack[0].y][stack[0].x] = true;
    let startX = wallSize + stack[0].x * step, startY = wallSize + stack[0].y * step;
    for (let r = 0; r < pathSize; r++) for (let c = 0; c < pathSize; c++) if (startY + r < MAZE_HEIGHT && startX + c < MAZE_WIDTH) maze[startY + r][startX + c] = 0;
    while (stack.length > 0) {
        let current = stack[stack.length - 1], neighbors = [];
        if (current.y > 0 && !metaVisited[current.y - 1][current.x]) neighbors.push({ x: current.x, y: current.y - 1, dir: 'N' });
        if (current.y < metaHeight - 1 && !metaVisited[current.y + 1][current.x]) neighbors.push({ x: current.x, y: current.y + 1, dir: 'S' });
        if (current.x > 0 && !metaVisited[current.y][current.x - 1]) neighbors.push({ x: current.x - 1, y: current.y, dir: 'W' });
        if (current.x < metaWidth - 1 && !metaVisited[current.y][current.x + 1]) neighbors.push({ x: current.x + 1, y: current.y, dir: 'E' });
        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            let currentX = wallSize + current.x * step, currentY = wallSize + current.y * step;
            if (next.dir === 'N') for (let i = 0; i < pathSize; i++) maze[currentY - 1][currentX + i] = 0;
            else if (next.dir === 'S') for (let i = 0; i < pathSize; i++) maze[currentY + pathSize][currentX + i] = 0;
            else if (next.dir === 'W') for (let i = 0; i < pathSize; i++) maze[currentY + i][currentX - 1] = 0;
            else if (next.dir === 'E') for (let i = 0; i < pathSize; i++) maze[currentY + i][currentX + pathSize] = 0;
            let nextX = wallSize + next.x * step, nextY = wallSize + next.y * step;
            for (let r = 0; r < pathSize; r++) for (let c = 0; c < pathSize; c++) if (nextY + r < MAZE_HEIGHT && nextX + c < MAZE_WIDTH) maze[nextY + r][nextX + c] = 0;
            metaVisited[next.y][next.x] = true;
            stack.push(next);
        } else stack.pop();
    }
}

// --- Difficulty-based Start/End Placement ---
function placeStartEnd() {
    // 1. Create 16 virtual blocks (4x4 grid).
    const VIRTUAL_GRID_COLS = 4;
    const VIRTUAL_GRID_ROWS = 4;
    const blockWidth = MAZE_WIDTH / VIRTUAL_GRID_COLS;
    const blockHeight = MAZE_HEIGHT / VIRTUAL_GRID_ROWS;

    // 2. Place Start Point: Pick a random outer edge block.
    const startEdge = ['top', 'bottom', 'left', 'right'][Math.floor(Math.random() * 4)];
    let startBlock, endBlock;

    switch (startEdge) {
        case 'top':
            startBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: 0 };
            endBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: VIRTUAL_GRID_ROWS - 1 };
            break;
        case 'bottom':
            startBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: VIRTUAL_GRID_ROWS - 1 };
            endBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: 0 };
            break;
        case 'left':
            startBlock = { x: 0, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) };
            endBlock = { x: VIRTUAL_GRID_COLS - 1, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) };
            break;
        case 'right':
            startBlock = { x: VIRTUAL_GRID_COLS - 1, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) };
            endBlock = { x: 0, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) };
            break;
    }

    // Helper to find a random valid path *center* (the (1,1) of a 3x3 path) within a virtual block.
    const getRandomCenterInBlock = (virtualX, virtualY) => {
        const validPositions = [];
        const startX = Math.floor(virtualX * blockWidth);
        const startY = Math.floor(virtualY * blockHeight);
        const endX = Math.floor(startX + blockWidth);
        const endY = Math.floor(startY + blockHeight);
        
        const pathSize = 3, wallSize = 1, step = pathSize + wallSize;
        // CORRECTED: The center of a path block is at coordinate 2, 6, 10...
        // which is (coord - 2) % 4 === 0.
        const centerOffset = wallSize + Math.floor(pathSize / 2); // 1 + 1 = 2

        for (let r = startY; r < endY && r < MAZE_HEIGHT; r++) {
            for (let c = startX; c < endX && c < MAZE_WIDTH; c++) {
                // Check if the cell is a center of a 3x3 path area
                if ((c - centerOffset) % step === 0 && (r - centerOffset) % step === 0 && maze[r][c] === 0) {
                     validPositions.push({ x: c, y: r });
                }
            }
        }

        if (validPositions.length > 0) {
            return validPositions[Math.floor(Math.random() * validPositions.length)];
        }
        return null; // No valid position found
    };

    // 2 & 3. Get start and end positions from their respective blocks.
    startPos = getRandomCenterInBlock(startBlock.x, startBlock.y);
    endPos = getRandomCenterInBlock(endBlock.x, endBlock.y);

    // Fallback if a block has no valid path centers
    if (!startPos || !endPos) {
        console.error("Could not find valid start/end points in designated blocks. Using fallback.");
        const pathCells = [];
        for (let r = 0; r < MAZE_HEIGHT; r++) for (let c = 0; c < MAZE_WIDTH; c++) if (maze[r][c] === 0) pathCells.push({ x: c, y: r });
        if (pathCells.length < 2) {
            startPos = {x:1, y:1}; endPos = {x:MAZE_WIDTH-2, y:MAZE_HEIGHT-2};
        } else {
            startPos = pathCells[0];
            endPos = pathCells[pathCells.length - 1];
        }
    }

    player = { ...startPos };
    playerPath = [{ ...player }];
}


function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < maze.length; r++) for (let c = 0; c < maze[r].length; c++) {
        ctx.fillStyle = (maze[r][c] === 0) ? '#FFFFFF' : '#555555';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    if (eButtonUsed && playerPath.length > 0) {
        ctx.fillStyle = eButtonPathColor;
        for (let i = 0; i < playerPath.length; i++) ctx.fillRect(playerPath[i].x * TILE_SIZE, playerPath[i].y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2, (TILE_SIZE / 4) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${TILE_SIZE * 0.4 * 3}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'white';
    ctx.fillText('●', startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2);
    ctx.font = `${TILE_SIZE * 0.7 * 3}px Arial`;
    ctx.fillText(flagFrames[0], endPos.x * TILE_SIZE + TILE_SIZE / 2, endPos.y * TILE_SIZE + TILE_SIZE / 2 + flagYOffset);
    ctx.font = `${TILE_SIZE * 0.8 * 3}px Arial`;
    ctx.fillText(playerSprite, player.x * TILE_SIZE + TILE_SIZE / 2, player.y * TILE_SIZE + TILE_SIZE / 2);
    for (const key in savedPositions) {
        const pos = savedPositions[key];
        if (pos) {
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.beginPath();
            ctx.arc(pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2, (TILE_SIZE / 2.5) * 3, 0, Math.PI * 2);
            ctx.fill();
            switch (key) { case '1': ctx.fillStyle = 'red'; break; case '2': ctx.fillStyle = 'orange'; break; case '3': ctx.fillStyle = 'yellow'; break; case '4': ctx.fillStyle = 'green'; break; default: ctx.fillStyle = 'white'; }
            ctx.font = `${TILE_SIZE * 0.6 * 3}px Arial`;
            ctx.fillText(key, pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2);
        }
    }
}

function animate() {
    if (gameWon) { cancelAnimationFrame(animationFrameId); return; }
    flagAnimationTime += 0.05;
    flagYOffset = Math.sin(flagAnimationTime) * (TILE_SIZE * 0.15);
    drawMaze();
    animationFrameId = requestAnimationFrame(animate);
}

// --- Player Movement and Game Logic ---
function movePlayer(dx, dy) {
    if (gameWon) return;
    const pathSize = 3, wallSize = 1, step = pathSize + wallSize, offset = Math.floor(pathSize / 2);
    const wallCheckX = player.x + dx * (offset + wallSize), wallCheckY = player.y + dy * (offset + wallSize);
    if (wallCheckX < 0 || wallCheckX >= MAZE_WIDTH || wallCheckY < 0 || wallCheckY >= MAZE_HEIGHT) return;
    if (maze[wallCheckY]?.[wallCheckX] === 0) {
        player.x += dx * step;
        player.y += dy * step;
        playerPath.push({ x: player.x, y: player.y });
        if (playerPath.length > MAX_PLAYER_PATH) playerPath.shift();
        drawMaze();
        checkWin();
        playRunningSound();
    }
}

function updateTimerDisplay() {
    const ms = Date.now() - startTime;
    const mins = String(Math.floor(ms / 60000)).padStart(2, '0');
    const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const centisecs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    timerDisplay.textContent = `${mins}분${secs}초${centisecs}`;
}

function startTimer() { startTime = Date.now(); timerInterval = setInterval(updateTimerDisplay, 10); }
function stopTimer() { clearInterval(timerInterval); }

function checkWin() {
    if (player.x === endPos.x && player.y === endPos.y) {
        stopTimer();
        gameWon = true;
        winTimeMessage.textContent = `시간: ${timerDisplay.textContent}`;
        winMazeSizeMessage.textContent = `클리어한 미로 크기: ${MAZE_WIDTH} x ${MAZE_HEIGHT}`;
        winModal.style.display = 'flex';
    }
}

function saveOrLoadPosition(key) {
    if (gameWon) return;
    const currentPos = { x: player.x, y: player.y };
    const savedPos = savedPositions[key];
    if (savedPos && currentPos.x === savedPos.x && currentPos.y === savedPos.y) savedPositions[key] = null;
    else if (savedPos) { player.x = savedPos.x; player.y = savedPos.y; savedPositions[key] = null; checkWin(); }
    else savedPositions[key] = { ...currentPos };
    drawMaze();
    playRollbackSound();
}

async function takeScreenshot() {
    playShutterSound();
    flashOverlay.classList.add('flash-effect');
    setTimeout(() => flashOverlay.classList.remove('flash-effect'), 300);
    try {
        const canvasElement = await html2canvas(mainLayout);
        const imageDataUrl = canvasElement.toDataURL('image/png');
        if (navigator.clipboard && navigator.clipboard.write) {
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        } else { throw new Error('Clipboard API not available'); }
        screenshotImage.src = imageDataUrl;
        screenshotModal.style.display = 'flex';
    } catch (err) {
        console.error('Screenshot failed:', err);
    }
}

function handleQButton() {
    if (gameWon || qButtonUsed) return;
    qButtonUsed = true;
    qButton.disabled = true;
    qButton_joystick.disabled = true;
    playQButtonSound();
    player.x = startPos.x;
    player.y = startPos.y;
    playerPath = [{ ...player }];
    drawMaze();
}

function handleEButton() {
    if (gameWon || eButtonUsed) return;
    eButtonUsed = true;
    eButton.disabled = true;
    eButton_joystick.disabled = true;
    playEButtonSound();
    drawMaze();
    eButtonClearInterval = setInterval(() => {
        if (playerPath.length > 0) { playerPath.shift(); drawMaze(); }
        else { clearInterval(eButtonClearInterval); eButtonClearInterval = null; }
    }, 500);
}

// --- Pathfinding for Solvability Test (BFS) ---
function findShortestPath() {
    if (!startPos || !endPos) return -1;
    const queue = [{ x: startPos.x, y: startPos.y, dist: 1 }];
    const visited = Array(MAZE_HEIGHT).fill(false).map(() => Array(MAZE_WIDTH).fill(false));
    visited[startPos.y][startPos.x] = true;
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === endPos.x && current.y === endPos.y) return current.dist;
        for (const [dx, dy] of directions) {
            const nextX = current.x + dx, nextY = current.y + dy;
            if (nextX >= 0 && nextX < MAZE_WIDTH && nextY >= 0 && nextY < MAZE_HEIGHT && maze[nextY][nextX] === 0 && !visited[nextY][nextX]) {
                visited[nextY][nextX] = true;
                queue.push({ x: nextX, y: nextY, dist: current.dist + 1 });
            }
        }
    }
    return -1; // Path not found
}

// --- Game Initialization and Reset ---
function initGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    winModal.style.display = 'none';
    helpModal.style.display = 'none';
    screenshotModal.style.display = 'none';
    gameWon = false;
    eButtonUsed = false;
    eButton.disabled = false;
    eButton_joystick.disabled = false;
    if (eButtonClearInterval) { clearInterval(eButtonClearInterval); eButtonClearInterval = null; }
    eButtonPathColor = getRandomTransparentColor();
    qButtonUsed = false;
    qButton.disabled = false;
    qButton_joystick.disabled = false;
    stopTimer();
    timerDisplay.textContent = '00분00초00';
    for (let key in savedPositions) savedPositions[key] = null;
    
    initializeCanvasSize();

    // --- Maze Generation and Difficulty Validation Loop ---
    let attempts = 0;
    const maxAttempts = 50;
    do {
        // 1. Generate the maze structure.
        generateMaze();
        
        // 2, 3, 4. Set start/end points based on the virtual block logic.
        placeStartEnd(); 
        
        attempts++;
        if (attempts > maxAttempts) {
            console.error("Could not generate a solvable maze after " + maxAttempts + " attempts.");
            break;
        }
    // 5. Test if a path exists between the generated points. If not, regenerate.
    } while (findShortestPath() === -1); 

    playImpactSound();
    animate();
    startTimer();
}

function showStartScreen() {
    startScreenModal.style.display = 'flex';
    mainLayout.style.display = 'none';
    winModal.style.display = 'none';
    helpModal.style.display = 'none';
    screenshotModal.style.display = 'none';
    ageButtonsContainer.parentElement.classList.remove('hidden');
    customSizeContainer.classList.add('hidden');
    document.querySelectorAll('.control-mode-button').forEach(btn => {
        btn.style.backgroundColor = '#BDECB6';
    });
    document.querySelector('.control-mode-button[data-mode="keyboard"]').style.backgroundColor = '#4F46E5';
}

// --- Event Listeners ---
function startContinuousMove(direction) {
    if (gameWon || startScreenModal.style.display === 'flex' || helpModal.style.display === 'flex' || screenshotModal.style.display === 'flex') return;
    if (moveIntervals[direction]) return;
    const moveMap = { 'up': () => movePlayer(0, -1), 'down': () => movePlayer(0, 1), 'left': () => movePlayer(-1, 0), 'right': () => movePlayer(1, 0) };
    moveMap[direction]();
    moveIntervals[direction] = setInterval(moveMap[direction], 150);
}

function stopContinuousMove(direction) {
    if (moveIntervals[direction]) { clearInterval(moveIntervals[direction]); delete moveIntervals[direction]; }
}

document.addEventListener('keydown', (e) => {
    if (gameWon || startScreenModal.style.display === 'flex' || helpModal.style.display === 'flex' || screenshotModal.style.display === 'flex') return;
    if (['1', '2', '3', '4'].includes(e.key)) saveOrLoadPosition(e.key);
    if (e.key === 'q' || e.key === 'Q') handleQButton();
    if (e.key === 'e' || e.key === 'E') handleEButton();
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
        case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
    }
});

// Joystick Listeners
function handleJoystickMove(event) {
    if (!isJoystickActive) return;
    event.preventDefault();
    const rect = joystickBase.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = (joystickBase.offsetWidth / 2) * 0.5;

    if (distance > maxDist) {
        dx = (dx / distance) * maxDist;
        dy = (dy / distance) * maxDist;
    }
    
    joystickDx = dx;
    joystickDy = dy;
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function startJoystick(event) {
    isJoystickActive = true;
    joystickKnob.style.backgroundColor = getRandomSolidColor();
    
    if (joystickInitialTimeout) clearTimeout(joystickInitialTimeout);
    if (joystickRepeatInterval) clearInterval(joystickRepeatInterval);

    const executeMove = () => {
        if (!isJoystickActive) return;
        const dx = joystickDx;
        const dy = joystickDy;
        const threshold = 10;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) movePlayer(1, 0); else movePlayer(-1, 0);
        } else {
            if (dy > 0) movePlayer(0, 1); else movePlayer(0, -1);
        }
    };

    joystickInitialTimeout = setTimeout(() => {
        executeMove();
        joystickRepeatInterval = setInterval(executeMove, JOYSTICK_REPEAT_DELAY);
    }, JOYSTICK_INITIAL_DELAY);

    handleJoystickMove(event);
}

function stopJoystick() {
    isJoystickActive = false;
    if (joystickInitialTimeout) clearTimeout(joystickInitialTimeout);
    if (joystickRepeatInterval) clearInterval(joystickRepeatInterval);
    
    joystickDx = 0;
    joystickDy = 0;
    joystickKnob.style.transform = 'translate(0, 0)';
    joystickKnob.style.backgroundColor = '#cccccc';
}

joystickBase.addEventListener('mousedown', startJoystick);
joystickBase.addEventListener('touchstart', startJoystick, { passive: false });
document.addEventListener('mousemove', handleJoystickMove);
document.addEventListener('touchmove', handleJoystickMove, { passive: false });
document.addEventListener('mouseup', stopJoystick);
document.addEventListener('touchend', stopJoystick);

// Button Listeners
document.getElementById('up').addEventListener('mousedown', (e) => { e.preventDefault(); startContinuousMove('up'); });
document.getElementById('down').addEventListener('mousedown', (e) => { e.preventDefault(); startContinuousMove('down'); });
document.getElementById('left').addEventListener('mousedown', (e) => { e.preventDefault(); startContinuousMove('left'); });
document.getElementById('right').addEventListener('mousedown', (e) => { e.preventDefault(); startContinuousMove('right'); });
document.addEventListener('mouseup', () => { for (const dir in moveIntervals) stopContinuousMove(dir); });
['up', 'down', 'left', 'right'].forEach(dir => document.getElementById(dir).addEventListener('mouseleave', () => stopContinuousMove(dir)));

qButton.addEventListener('click', handleQButton);
eButton.addEventListener('click', handleEButton);
qButton_joystick.addEventListener('click', handleQButton);
eButton_joystick.addEventListener('click', handleEButton);

[rollback1_left, rollback1_right, rollback1_joystick].forEach(btn => btn.addEventListener('click', () => saveOrLoadPosition('1')));
[rollback2_left, rollback2_right, rollback2_joystick].forEach(btn => btn.addEventListener('click', () => saveOrLoadPosition('2')));
[rollback3_left, rollback3_right, rollback3_joystick].forEach(btn => btn.addEventListener('click', () => saveOrLoadPosition('3')));
[rollback4_left, rollback4_right, rollback4_joystick].forEach(btn => btn.addEventListener('click', () => saveOrLoadPosition('4')));

restartButton.addEventListener('click', initGame);
winRestartButton.addEventListener('click', () => { winModal.style.display = 'none'; initGame(); });
resetSizeButton.addEventListener('click', showStartScreen);
helpButton.addEventListener('click', () => { helpModal.style.display = 'flex'; });
closeHelpModalButton.addEventListener('click', () => { helpModal.style.display = 'none'; });
shareButton.addEventListener('click', takeScreenshot);
closeScreenshotModalButton.addEventListener('click', () => { screenshotModal.style.display = 'none'; });

window.addEventListener('resize', () => { if (mainLayout.style.display === 'flex') initGame(); });
document.addEventListener('DOMContentLoaded', () => { populateSizeDropdowns(); showStartScreen(); initAudio(); });