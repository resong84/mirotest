// ===================================================================
// 1. 코드 구조 개선: 기능별 그룹화
// ===================================================================

// ===================================================================
// 2. DOM 요소 및 전역 상태 (DOM & State Module)
// ===================================================================

// --- 미로 생성 핵심 파라미터 ---
const PATH_SIZE = 5; 
const WALL_SIZE = 1; 
const STEP = PATH_SIZE + WALL_SIZE; 
const CENTER_OFFSET = WALL_SIZE + Math.floor(PATH_SIZE / 2); 

// --- DOM 요소 ---
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');
const mainLayout = document.querySelector('.main-layout');

// Buttons
const restartButton = document.getElementById('restartButton');
const resetSizeButton = document.getElementById('resetSizeButton');
const helpButton = document.getElementById('helpButton');
const shareButton = document.getElementById('shareButton');
const autoFitButton = document.getElementById('autoFitButton');
const qButton = document.getElementById('qButton');
const eButton = document.getElementById('eButton');
const qButton_joystick = document.getElementById('qButton_joystick');
const eButton_joystick = document.getElementById('eButton_joystick');
const backToPresetButton = document.getElementById('backToPresetButton');

// Rollback Buttons
const rollbackButtons = {
    '1': [document.getElementById('rollback1_left'), document.getElementById('rollback1_joystick')],
    '2': [document.getElementById('rollback2_left'), document.getElementById('rollback2_joystick')],
};

// Joystick
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

// Start Screen
const startScreenModal = document.getElementById('startScreenModal');
const controlModeContainer = document.getElementById('controlModeContainer');
const ageButtonsContainer = document.getElementById('ageButtonsContainer');
const customSizeBtn = document.getElementById('customSizeBtn');
const customSizeContainer = document.getElementById('customSizeContainer');
const mazeWidthSelect = document.getElementById('mazeWidthSelect');
const mazeHeightSelect = document.getElementById('mazeHeightSelect');
const startButton = document.getElementById('startButton');

// Modals
const winModal = document.getElementById('winModal');
const winTimeMessage = document.getElementById('winTimeMessage');
const winMazeSizeMessage = document.getElementById('winMazeSizeMessage');
const winRestartButton = document.getElementById('winRestartButton');
const winHomeButton = document.getElementById('winHomeButton');
const helpModal = document.getElementById('helpModal');
const closeHelpModalButton = document.getElementById('closeHelpModalButton');
const screenshotModal = document.getElementById('screenshotModal');
const screenshotImage = document.getElementById('screenshotImage');
const closeScreenshotModalButton = document.getElementById('closeScreenshotModalButton');
const flashOverlay = document.getElementById('flashOverlay');

// --- 전역 게임 상태 ---
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
let animationFrameId;
let flagAnimationTime = 0;
let savedPositions = { '1': null, '2': null };
var moveIntervals = {};

// Joystick state
let isJoystickActive = false;
let joystickInitialTimeout = null;
let joystickRepeatInterval = null;
let joystickDx = 0, joystickDy = 0;
const JOYSTICK_INITIAL_DELAY = 300;
const JOYSTICK_REPEAT_DELAY = 200;

// Audio state
let audioContextResumed = false;
let runningSynth, rollbackSynth, impactSynth, qButtonSynth, eButtonSynth, shutterSynth;
const runningNotes = ["C4", "E4", "G4", "C5"];
let currentRunningNoteIndex = 0;


// ===================================================================
// 3. 오디오 모듈 (Audio Module)
// ===================================================================

function initAudio() {
    runningSynth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    rollbackSynth = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.2 } }).toDestination();
    impactSynth = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 1, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.6 }, oscillator: { type: "sine" } }).toDestination();
    qButtonSynth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();
    eButtonSynth = new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.15 } }).toDestination();
    shutterSynth = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.1 } }).toDestination();

    const resumeAudio = () => {
        if (!audioContextResumed) {
            Tone.start();
            audioContextResumed = true;
        }
        document.documentElement.removeEventListener('mousedown', resumeAudio);
        document.documentElement.removeEventListener('touchstart', resumeAudio);
    };
    document.documentElement.addEventListener('mousedown', resumeAudio, { once: true });
    document.documentElement.addEventListener('touchstart', resumeAudio, { once: true });
}

function playRunningSound() { if (audioContextResumed) { runningSynth.triggerAttackRelease(runningNotes[currentRunningNoteIndex], "16n"); currentRunningNoteIndex = (currentRunningNoteIndex + 1) % runningNotes.length; } }
function playRollbackSound() { if (audioContextResumed) rollbackSynth.triggerAttackRelease("G5", "16n"); }
function playImpactSound() { if (audioContextResumed) { impactSynth.triggerAttackRelease("C1", "8n"); setTimeout(() => impactSynth.triggerAttackRelease("G1", "8n"), 200); } }
function playQButtonSound() { if (audioContextResumed) qButtonSynth.triggerAttackRelease("A4", "8n"); }
function playEButtonSound() { if (audioContextResumed) eButtonSynth.triggerAttackRelease("F4", "8n"); }
function playShutterSound() { if (audioContextResumed) shutterSynth.triggerAttackRelease("8n"); }


// ===================================================================
// 4. UI 및 그리기 모듈 (UI & Drawing Module)
// ===================================================================

function getRandomTransparentColor() { return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.5)`; }
function getRandomSolidColor() { return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`; }

function initializeCanvasSize() {
    const minTileSize = 3; 
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

function drawMaze(flagYOffset = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const wallColor = '#555555';
    const pathColor = '#FFFFFF';
    
    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[r].length; c++) {
            ctx.fillStyle = (maze[r][c] === 1) ? wallColor : pathColor;
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    
    if (eButtonUsed && playerPath.length > 0) {
        ctx.fillStyle = eButtonPathColor;
        playerPath.forEach(p => ctx.fillRect(p.x * TILE_SIZE, p.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
    }
    
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';

    ctx.font = `${TILE_SIZE * 4.5}px Arial`;
    ctx.fillText('⛩️', startPos.x * TILE_SIZE + TILE_SIZE / 2, startPos.y * TILE_SIZE + TILE_SIZE / 2);
    ctx.fillText('🚩', endPos.x * TILE_SIZE + TILE_SIZE / 2, endPos.y * TILE_SIZE + TILE_SIZE / 2 + flagYOffset);
    
    for (const key in savedPositions) {
        const pos = savedPositions[key];
        if (pos) {
            const markerSize = TILE_SIZE * 4.5;
            const halfMarkerSize = markerSize / 2;
            const centerX = pos.x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = pos.y * TILE_SIZE + TILE_SIZE / 2;

            ctx.fillStyle = (key === '1') ? '#FFB6C1' : '#A7C7E7';
            ctx.beginPath();
            ctx.roundRect(centerX - halfMarkerSize, centerY - halfMarkerSize, markerSize, markerSize, TILE_SIZE);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.7)';
            ctx.font = `bold ${TILE_SIZE * 2.0}px Arial`;
            ctx.fillText(key, centerX, centerY);
            ctx.textShadow = 'none';
        }
    }

    ctx.font = `${TILE_SIZE * 4.0}px Arial`;
    ctx.fillText('🐎', player.x * TILE_SIZE + TILE_SIZE / 2, player.y * TILE_SIZE + TILE_SIZE / 2);
}

function animate() {
    if (gameWon) { cancelAnimationFrame(animationFrameId); return; }
    
    flagAnimationTime += 0.05;
    const flagYOffset = Math.sin(flagAnimationTime) * (TILE_SIZE * 0.4);
    
    drawMaze(flagYOffset);
    
    animationFrameId = requestAnimationFrame(animate);
}

function updateTimerDisplay() {
    const ms = Date.now() - startTime;
    const mins = String(Math.floor(ms / 60000)).padStart(2, '0');
    const secs = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const centisecs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    timerDisplay.textContent = `${mins}분${secs}초${centisecs}`;
}

function calculateAndDisplayMaxMazeSize() {
    const tempLayout = document.createElement('div');
    tempLayout.style.width = '100%';
    tempLayout.style.maxWidth = '600px';
    tempLayout.style.height = `calc(100vh - 40px)`;
    tempLayout.style.position = 'fixed';
    tempLayout.style.visibility = 'hidden';
    tempLayout.style.display = 'flex';
    tempLayout.style.flexDirection = 'column';

    const tempHeader = document.createElement('header');
    tempHeader.style.height = '75%';
    tempHeader.style.padding = '12px';

    tempLayout.appendChild(tempHeader);
    document.body.appendChild(tempLayout);

    const MINIMUM_VIABLE_TILE_SIZE = 3;
    const availableWidth = tempHeader.clientWidth;
    const availableHeight = tempHeader.clientHeight;
    
    let maxWidth = Math.floor(availableWidth / MINIMUM_VIABLE_TILE_SIZE);
    let maxHeight = Math.floor(availableHeight / MINIMUM_VIABLE_TILE_SIZE);
    
    maxWidth = maxWidth - (maxWidth % STEP) + 1;
    maxHeight = maxHeight - (maxHeight % STEP) + 1;

    autoFitButton.textContent = `최대 크기 (${maxWidth}x${maxHeight})`;
    
    document.body.removeChild(tempLayout);
}

function showStartScreen() {
    startScreenModal.style.display = 'flex';
    mainLayout.style.display = 'none';
    [winModal, helpModal, screenshotModal].forEach(modal => modal.style.display = 'none');
    ageButtonsContainer.parentElement.classList.remove('hidden');
    customSizeContainer.classList.add('hidden');
    document.querySelectorAll('.control-mode-button').forEach(btn => btn.style.backgroundColor = '');
    const selectedBtn = document.querySelector(`.control-mode-button[data-mode="${controlMode}"]`);
    if(selectedBtn) selectedBtn.style.backgroundColor = '#4F46E5';

    calculateAndDisplayMaxMazeSize();
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
        } else {
            const link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = 'maze-screenshot.png';
            link.click();
        }
        screenshotImage.src = imageDataUrl;
        screenshotModal.style.display = 'flex';
    } catch (err) {
        console.error('Screenshot failed:', err);
        alert('스크린샷 생성 또는 클립보드 복사에 실패했습니다.');
    }
}


// ===================================================================
// 5. 미로 생성 및 게임 로직 (Maze & Game Logic Module)
// ===================================================================

function generateMaze() {
    maze = Array(MAZE_HEIGHT).fill(0).map(() => Array(MAZE_WIDTH).fill(1));
    const metaWidth = Math.floor((MAZE_WIDTH - WALL_SIZE) / STEP);
    const metaHeight = Math.floor((MAZE_HEIGHT - WALL_SIZE) / STEP);

    if (metaWidth <= 0 || metaHeight <= 0) {
        maze = Array(MAZE_HEIGHT).fill(0).map(() => Array(MAZE_WIDTH).fill(0));
        return;
    }

    let metaVisited = Array(metaHeight).fill(0).map(() => Array(metaWidth).fill(false));
    let stack = [{ x: Math.floor(Math.random() * metaWidth), y: Math.floor(Math.random() * metaHeight) }];
    metaVisited[stack[0].y][stack[0].x] = true;

    let startX = WALL_SIZE + stack[0].x * STEP;
    let startY = WALL_SIZE + stack[0].y * STEP;
    for (let r = 0; r < PATH_SIZE; r++) {
        for (let c = 0; c < PATH_SIZE; c++) {
            if (startY + r < MAZE_HEIGHT && startX + c < MAZE_WIDTH) {
                maze[startY + r][startX + c] = 0;
            }
        }
    }
    
    while (stack.length > 0) {
        let current = stack[stack.length - 1];
        let neighbors = [];
        const directions = [ { x: 0, y: -1, dir: 'N' }, { x: 0, y: 1, dir: 'S' }, { x: -1, y: 0, dir: 'W' }, { x: 1, y: 0, dir: 'E' } ];
        
        for(const {x, y, dir} of directions) {
            const nx = current.x + x;
            const ny = current.y + y;
            if (ny >= 0 && ny < metaHeight && nx >= 0 && nx < metaWidth && !metaVisited[ny][nx]) {
                 neighbors.push({ x: nx, y: ny, dir });
            }
        }

        if (neighbors.length > 0) {
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            let currentMazeX = WALL_SIZE + current.x * STEP;
            let currentMazeY = WALL_SIZE + current.y * STEP;

            if (next.dir === 'N') {
                for (let i = 0; i < WALL_SIZE; i++) for (let j = 0; j < PATH_SIZE; j++) maze[currentMazeY - 1 - i][currentMazeX + j] = 0;
            } else if (next.dir === 'S') {
                for (let i = 0; i < WALL_SIZE; i++) for (let j = 0; j < PATH_SIZE; j++) maze[currentMazeY + PATH_SIZE + i][currentMazeX + j] = 0;
            } else if (next.dir === 'W') {
                for (let i = 0; i < WALL_SIZE; i++) for (let j = 0; j < PATH_SIZE; j++) maze[currentMazeY + j][currentMazeX - 1 - i] = 0;
            } else if (next.dir === 'E') {
                for (let i = 0; i < WALL_SIZE; i++) for (let j = 0; j < PATH_SIZE; j++) maze[currentMazeY + j][currentMazeX + PATH_SIZE + i] = 0;
            }

            let nextMazeX = WALL_SIZE + next.x * STEP;
            let nextMazeY = WALL_SIZE + next.y * STEP;
            for (let r = 0; r < PATH_SIZE; r++) for (let c = 0; c < PATH_SIZE; c++) if (nextMazeY + r < MAZE_HEIGHT && nextMazeX + c < MAZE_WIDTH) maze[nextMazeY + r][nextMazeX + c] = 0;
            
            metaVisited[next.y][next.x] = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
}

function placeStartEnd() {
    let VIRTUAL_GRID_COLS, VIRTUAL_GRID_ROWS;
    let startBlock, endBlock;

    // 정사각형 미로 로직
    if (MAZE_WIDTH === MAZE_HEIGHT) {
        VIRTUAL_GRID_COLS = 4;
        VIRTUAL_GRID_ROWS = 4;
        const startEdge = ['top', 'bottom', 'left', 'right'][Math.floor(Math.random() * 4)];
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
    } else { // 직사각형 미로 로직 (수정됨)
        if (MAZE_WIDTH < MAZE_HEIGHT) { // 세로가 더 긴 경우 -> 위/아래에 배치
            VIRTUAL_GRID_COLS = 4;
            VIRTUAL_GRID_ROWS = 8;
            if (Math.random() < 0.5) {
                startBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: 0 }; // TOP
                endBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: VIRTUAL_GRID_ROWS - 1 }; // BOTTOM
            } else {
                startBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: VIRTUAL_GRID_ROWS - 1 }; // BOTTOM
                endBlock = { x: Math.floor(Math.random() * VIRTUAL_GRID_COLS), y: 0 }; // TOP
            }
        } else { // 가로가 더 긴 경우 -> 좌/우에 배치
            VIRTUAL_GRID_COLS = 8;
            VIRTUAL_GRID_ROWS = 4;
            if (Math.random() < 0.5) {
                startBlock = { x: 0, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) }; // LEFT
                endBlock = { x: VIRTUAL_GRID_COLS - 1, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) }; // RIGHT
            } else {
                startBlock = { x: VIRTUAL_GRID_COLS - 1, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) }; // RIGHT
                endBlock = { x: 0, y: Math.floor(Math.random() * VIRTUAL_GRID_ROWS) }; // LEFT
            }
        }
    }

    const blockWidth = MAZE_WIDTH / VIRTUAL_GRID_COLS;
    const blockHeight = MAZE_HEIGHT / VIRTUAL_GRID_ROWS;

    const getRandomCenterInBlock = (virtualX, virtualY) => {
        const validPositions = [];
        const startX = Math.floor(virtualX * blockWidth);
        const startY = Math.floor(virtualY * blockHeight);
        const endX = Math.floor(startX + blockWidth);
        const endY = Math.floor(startY + blockHeight);
        
        for (let r = startY; r < endY && r < MAZE_HEIGHT; r++) {
            for (let c = startX; c < endX && c < MAZE_WIDTH; c++) {
                if ((c - CENTER_OFFSET) % STEP === 0 && (r - CENTER_OFFSET) % STEP === 0 && maze[r][c] === 0) {
                     validPositions.push({ x: c, y: r });
                }
            }
        }
        return validPositions.length > 0 ? validPositions[Math.floor(Math.random() * validPositions.length)] : null;
    };

    startPos = getRandomCenterInBlock(startBlock.x, startBlock.y);
    endPos = getRandomCenterInBlock(endBlock.x, endBlock.y);

    if (!startPos || !endPos) {
        console.error("Could not find valid start/end points. Using fallback.");
        const pathCells = [];
        for (let r = 0; r < MAZE_HEIGHT; r++) for (let c = 0; c < MAZE_WIDTH; c++) if (maze[r][c] === 0) pathCells.push({ x: c, y: r });
        startPos = pathCells.length > 0 ? pathCells[0] : {x:CENTER_OFFSET, y:CENTER_OFFSET};
        endPos = pathCells.length > 1 ? pathCells[pathCells.length - 1] : {x:MAZE_WIDTH-1-CENTER_OFFSET, y:MAZE_HEIGHT-1-CENTER_OFFSET};
    }
    
    player = { ...startPos };
    playerPath = [{ ...player }];
}

function findShortestPath() {
    if (!startPos || !endPos) return -1;
    const queue = [{ ...startPos, dist: 1 }];
    const visited = new Set([`${startPos.x},${startPos.y}`]);
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === endPos.x && current.y === endPos.y) return current.dist;

        for (const [dx, dy] of directions) {
            const wallCheckX = current.x + dx * CENTER_OFFSET;
            const wallCheckY = current.y + dy * CENTER_OFFSET;
            
            if (wallCheckX >= 0 && wallCheckX < MAZE_WIDTH && wallCheckY >= 0 && wallCheckY < MAZE_HEIGHT && maze[wallCheckY][wallCheckX] === 0) {
                 const nextX = current.x + dx * STEP;
                 const nextY = current.y + dy * STEP;
                 if (!visited.has(`${nextX},${nextY}`)) {
                    visited.add(`${nextX},${nextY}`);
                    queue.push({ x: nextX, y: nextY, dist: current.dist + 1 });
                }
            }
        }
    }
    return -1;
}

function checkWin() {
    if (player.x === endPos.x && player.y === endPos.y) {
        clearInterval(timerInterval);
        gameWon = true;
        winTimeMessage.textContent = `시간: ${timerDisplay.textContent}`;
        winMazeSizeMessage.textContent = `클리어한 미로 크기: ${MAZE_WIDTH} x ${MAZE_HEIGHT}`;
        winModal.style.display = 'flex';
    }
}


// ===================================================================
// 6. 컨트롤러 및 이벤트 핸들러 (Controls & Handlers Module)
// ===================================================================

function movePlayer(dx, dy) {
    if (gameWon) return;
    
    const wallCheckX = player.x + dx * CENTER_OFFSET;
    const wallCheckY = player.y + dy * CENTER_OFFSET;

    if (wallCheckX < 0 || wallCheckX >= MAZE_WIDTH || wallCheckY < 0 || wallCheckY >= MAZE_HEIGHT) return;
    if (maze[wallCheckY]?.[wallCheckX] === 0) {
        player.x += dx * STEP;
        player.y += dy * STEP;
        playerPath.push({ ...player });
        if (playerPath.length > MAX_PLAYER_PATH) playerPath.shift();
        
        checkWin();
        playRunningSound();
    }
}

function saveOrLoadPosition(key) {
    if (gameWon) return;
    const currentPos = { x: player.x, y: player.y };
    const savedPos = savedPositions[key];
    
    if (savedPos && currentPos.x === savedPos.x && currentPos.y === savedPos.y) {
        savedPositions[key] = null;
    } else if (savedPos) {
        player = { ...savedPos };
        savedPositions[key] = null;
        checkWin();
    } else {
        savedPositions[key] = { ...currentPos };
    }
    playRollbackSound();
}

function handleQButton() {
    if (gameWon || qButtonUsed) return;
    qButtonUsed = true;
    qButton.disabled = true;
    qButton_joystick.disabled = true;
    playQButtonSound();
    player = { ...startPos };
    playerPath = [{ ...player }];
}

function handleEButton() {
    if (gameWon || eButtonUsed) return;
    eButtonUsed = true;
    eButton.disabled = true;
    eButton_joystick.disabled = true;
    playEButtonSound();
    
    if (eButtonClearInterval) clearInterval(eButtonClearInterval);
    eButtonClearInterval = setInterval(() => {
        if (playerPath.length > 1) {
            playerPath.shift();
        } else {
            clearInterval(eButtonClearInterval);
            eButtonClearInterval = null;
        }
    }, 500);
}

function startContinuousMove(direction) {
    if (gameWon || moveIntervals[direction]) return;
    const moveMap = { 'up': () => movePlayer(0, -1), 'down': () => movePlayer(0, 1), 'left': () => movePlayer(-1, 0), 'right': () => movePlayer(1, 0) };
    moveMap[direction]();
    moveIntervals[direction] = setInterval(moveMap[direction], 150);
}
function stopContinuousMove(direction) {
    if (moveIntervals[direction]) {
        clearInterval(moveIntervals[direction]);
        delete moveIntervals[direction];
    }
}
function stopAllContinuousMoves() {
    for (const dir in moveIntervals) stopContinuousMove(dir);
}

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
        const threshold = 10;
        if (Math.abs(joystickDx) < threshold && Math.abs(joystickDy) < threshold) return;
        if (Math.abs(joystickDx) > Math.abs(joystickDy)) {
            if (joystickDx > 0) movePlayer(1, 0); else movePlayer(-1, 0);
        } else {
            if (joystickDy > 0) movePlayer(0, 1); else movePlayer(0, -1);
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
    clearTimeout(joystickInitialTimeout);
    clearInterval(joystickRepeatInterval);
    joystickDx = 0;
    joystickDy = 0;
    joystickKnob.style.transform = 'translate(0, 0)';
    joystickKnob.style.backgroundColor = 'var(--color-red-pastel)';
}


// ===================================================================
// 7. 게임 초기화 및 이벤트 리스너 설정 (Initialization & Listeners)
// ===================================================================

function initGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    gameWon = false;
    eButtonUsed = false;
    qButtonUsed = false;
    if (eButtonClearInterval) clearInterval(eButtonClearInterval);
    eButtonClearInterval = null;
    eButtonPathColor = getRandomTransparentColor();
    for (let key in savedPositions) savedPositions[key] = null;

    [winModal, helpModal, screenshotModal].forEach(modal => modal.style.display = 'none');
    [eButton, eButton_joystick, qButton, qButton_joystick].forEach(btn => btn.disabled = false);
    clearInterval(timerInterval);
    timerDisplay.textContent = '00분00초00';
    
    initializeCanvasSize();

    let attempts = 0;
    const maxAttempts = 50;
    do {
        generateMaze();
        placeStartEnd();
        attempts++;
        if (attempts > maxAttempts) {
            console.error("Failed to generate a solvable maze.");
            break;
        }
    } while (findShortestPath() === -1); 

    playImpactSound();
    animate();
    startTime = Date.now();
    timerInterval = setInterval(updateTimerDisplay, 10);
}

function setupEventListeners() {
    // --- Start Screen ---
    controlModeContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('control-mode-button')) {
            controlMode = e.target.dataset.mode;
            document.querySelectorAll('.control-mode-button').forEach(btn => btn.style.backgroundColor = '');
            e.target.style.backgroundColor = '#4F46E5';
        }
    });
    ageButtonsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('age-button')) {
            const size = parseInt(e.target.dataset.size);
            MAZE_WIDTH = size; MAZE_HEIGHT = size;
            mainLayout.className = `main-layout mode-${controlMode}`;
            startScreenModal.style.display = 'none';
            mainLayout.style.display = 'flex';
            initGame();
        }
    });
    customSizeBtn.addEventListener('click', () => {
        ageButtonsContainer.parentElement.classList.add('hidden');
        customSizeContainer.classList.remove('hidden');
    });
    startButton.addEventListener('click', () => {
        MAZE_WIDTH = parseInt(mazeWidthSelect.value);
        MAZE_HEIGHT = parseInt(mazeHeightSelect.value);
        mainLayout.className = `main-layout mode-${controlMode}`;
        startScreenModal.style.display = 'none';
        mainLayout.style.display = 'flex';
        initGame();
    });
    backToPresetButton.addEventListener('click', () => {
        customSizeContainer.classList.add('hidden');
        ageButtonsContainer.parentElement.classList.remove('hidden');
    });

    autoFitButton.addEventListener('click', () => {
        const MINIMUM_VIABLE_TILE_SIZE = 3;
        const tempLayout = document.createElement('div');
        tempLayout.style.width = '100%';
        tempLayout.style.maxWidth = '600px';
        tempLayout.style.height = `calc(100vh - 40px)`;
        tempLayout.style.position = 'fixed';
        tempLayout.style.visibility = 'hidden';
        tempLayout.style.display = 'flex';
        tempLayout.style.flexDirection = 'column';
        const tempHeader = document.createElement('header');
        tempHeader.style.height = '75%';
        tempHeader.style.padding = '12px';
        tempLayout.appendChild(tempHeader);
        document.body.appendChild(tempLayout);
        
        const availableWidth = tempHeader.clientWidth;
        const availableHeight = tempHeader.clientHeight;
        document.body.removeChild(tempLayout);

        let newWidth = Math.floor(availableWidth / MINIMUM_VIABLE_TILE_SIZE);
        let newHeight = Math.floor(availableHeight / MINIMUM_VIABLE_TILE_SIZE);
        
        newWidth = newWidth - (newWidth % STEP) + 1;
        newHeight = newHeight - (newHeight % STEP) + 1;

        MAZE_WIDTH = newWidth;
        MAZE_HEIGHT = newHeight;
        
        mainLayout.className = `main-layout mode-${controlMode}`;
        startScreenModal.style.display = 'none';
        mainLayout.style.display = 'flex';
        initGame();
    });

    // --- In-Game Controls ---
    document.addEventListener('keydown', (e) => {
        if (gameWon || startScreenModal.style.display !== 'none') return;
        const key = e.key.toLowerCase();
        if (['1', '2'].includes(key)) saveOrLoadPosition(key);
        if (key === 'q') handleQButton();
        if (key === 'w') handleEButton();
        
        if (key === 'w' && !eButtonUsed) return;

        switch (key) {
            case 'arrowup': case 'w': movePlayer(0, -1); break;
            case 'arrowdown': case 's': movePlayer(0, 1); break;
            case 'arrowleft': case 'a': movePlayer(-1, 0); break;
            case 'arrowright': case 'd': movePlayer(1, 0); break;
        }
    });

    ['up', 'down', 'left', 'right'].forEach(dir => {
        const btn = document.getElementById(dir);
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); startContinuousMove(dir); });
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startContinuousMove(dir); });
        btn.addEventListener('mouseleave', () => stopContinuousMove(dir));
        btn.addEventListener('touchend', () => stopContinuousMove(dir));
    });
    document.addEventListener('mouseup', stopAllContinuousMoves);

    joystickBase.addEventListener('mousedown', startJoystick);
    joystickBase.addEventListener('touchstart', startJoystick, { passive: false });
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('touchmove', handleJoystickMove, { passive: false });
    document.addEventListener('mouseup', stopJoystick);
    document.addEventListener('touchend', stopJoystick);

    [qButton, qButton_joystick].forEach(btn => btn.addEventListener('click', handleQButton));
    [eButton, eButton_joystick].forEach(btn => btn.addEventListener('click', handleEButton));
    for (const key in rollbackButtons) {
        rollbackButtons[key].forEach(btn => {
            if (btn) btn.addEventListener('click', () => saveOrLoadPosition(key));
        });
    }
    
    restartButton.addEventListener('click', initGame);
    winRestartButton.addEventListener('click', () => { winModal.style.display = 'none'; initGame(); });
    winHomeButton.addEventListener('click', showStartScreen);
    resetSizeButton.addEventListener('click', showStartScreen);
    helpButton.addEventListener('click', () => { helpModal.style.display = 'flex'; });
    closeHelpModalButton.addEventListener('click', () => { helpModal.style.display = 'none'; });
    shareButton.addEventListener('click', takeScreenshot);
    closeScreenshotModalButton.addEventListener('click', () => { screenshotModal.style.display = 'none'; });
    
    window.addEventListener('resize', () => { 
        if (mainLayout.style.display === 'flex') { 
            initializeCanvasSize(); 
        } else if (startScreenModal.style.display === 'flex') {
            calculateAndDisplayMaxMazeSize();
        }
    });
}

function populateSizeDropdowns() {
    mazeWidthSelect.innerHTML = '';
    mazeHeightSelect.innerHTML = '';

    const widthSizes = [43, 49, 55, 61, 67, 73, 79, 85, 91, 97, 103, 109];
    const heightSizes = [43, 49, 55, 61, 67, 73, 79, 85, 91, 97, 103, 109, 115, 121, 127];

    widthSizes.forEach(size => {
        mazeWidthSelect.add(new Option(size, size));
    });

    heightSizes.forEach(size => {
        mazeHeightSelect.add(new Option(size, size));
    });
}

// --- App Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        }
    }
    populateSizeDropdowns();
    setupEventListeners();
    initAudio();
    showStartScreen();
});