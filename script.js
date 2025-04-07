document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded - initializing snake game');
    
    // Game canvas and context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // DOM elements
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const finalScoreElement = document.getElementById('finalScore');
    const gameOverModal = document.getElementById('gameOverModal');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const pauseButton = document.getElementById('pauseButton');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Control buttons
    const upButton = document.getElementById('upButton');
    const downButton = document.getElementById('downButton');
    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    
    // Game settings
    const tileCount = 20;
    let tileSize = 0;
    let gameSpeed = 7; // Starting speed
    let running = false;
    let paused = false; // Add pause state
    
    // Game state
    let snake = [];
    let food = {};
    let direction = 'right'; // Always start with a direction
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameLoop;
    
    // Colors
    const snakeColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-color').trim();
    const foodColor = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
    const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
    const pauseOverlay = getComputedStyle(document.documentElement).getPropertyValue('--pause-overlay').trim();
    const pauseText = getComputedStyle(document.documentElement).getPropertyValue('--pause-text').trim();
    
    // Initial high score
    highScoreElement.textContent = highScore;
    
    // Dark mode
    function initDarkMode() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('snakeGameTheme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
        
        // Check system preference if no saved theme
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
    
    // Toggle dark mode
    function toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('snakeGameTheme', newTheme);
        
        // Update colors
        updateColors();
    }
    
    // Update colors when theme changes
    function updateColors() {
        snakeColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-color').trim();
        foodColor = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim();
        gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim();
        canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim();
        pauseOverlay = getComputedStyle(document.documentElement).getPropertyValue('--pause-overlay').trim();
        pauseText = getComputedStyle(document.documentElement).getPropertyValue('--pause-text').trim();
        
        // Redraw game if it's running
        if (running) {
            drawGame();
        }
    }
    
    // Initialize dark mode
    initDarkMode();
    
    // Dark mode toggle event listener
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Setup canvas dimensions
    function setupCanvas() {
        const gameArea = document.querySelector('.game-area');
        const size = gameArea.clientWidth;
        canvas.width = size;
        canvas.height = size;
        tileSize = canvas.width / tileCount;
        console.log(`Canvas set up with size ${size}px, tile size: ${tileSize}px`);
    }
    
    // Initialize game
    function initGame() {
        // Clear any existing game
        clearInterval(gameLoop);
        
        // Set initial snake position (3 segments)
        snake = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        
        // Reset game state
        score = 0;
        direction = 'right';
        paused = false;
        scoreElement.textContent = score;
        
        // Reset pause button
        pauseButton.textContent = 'II';
        pauseButton.classList.remove('paused');
        pauseButton.classList.add('visible');
        
        // Create initial food
        createFood();
        
        // Start game loop
        running = true;
        gameLoop = setInterval(updateGame, 1000 / gameSpeed);
        document.body.classList.add('game-active');
        
        console.log('Game initialized, snake is moving right');
    }
    
    // Create food at random position
    function createFood() {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        
        // Make sure food doesn't appear on snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                createFood(); // Recursively try again
                break;
            }
        }
    }
    
    // Main game update function
    function updateGame() {
        if (!running || paused) return;
        
        // Move snake
        moveSnake();
        
        // Check collisions
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // Check if food is eaten
        checkFood();
        
        // Render game
        drawGame();
    }
    
    // Move snake based on current direction
    function moveSnake() {
        // Create new head based on direction
        const head = {...snake[0]};
        
        switch(direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Add new head to beginning of snake
        snake.unshift(head);
        
        // Remove tail (unless food is eaten - handled in checkFood)
        snake.pop();
    }
    
    // Check for collisions with walls or self
    function checkCollision() {
        const head = snake[0];
        
        // Wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return true;
        }
        
        // Self collision (skip head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if snake has eaten food
    function checkFood() {
        const head = snake[0];
        
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score++;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Create new food
            createFood();
            
            // Add segment by not removing tail in moveSnake()
            snake.push({}); // Just add an empty object to maintain length
            
            // Speed up game slightly
            if (score % 5 === 0 && gameSpeed < 15) {
                gameSpeed++;
                clearInterval(gameLoop);
                gameLoop = setInterval(updateGame, 1000 / gameSpeed);
                console.log(`Speed increased to ${gameSpeed}`);
            }
        }
    }
    
    // Game over
    function gameOver() {
        running = false;
        clearInterval(gameLoop);
        finalScoreElement.textContent = score;
        gameOverModal.classList.add('active');
        document.body.classList.remove('game-active');
        pauseButton.classList.remove('visible');
        console.log('Game over! Final score:', score);
    }
    
    // Draw the game
    function drawGame() {
        // Clear canvas
        ctx.fillStyle = canvasBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        drawGrid();
        
        // Draw food
        drawFood();
        
        // Draw snake
        drawSnake();
        
        // Draw pause indicator if game is paused
        if (paused) {
            // Semi-transparent overlay
            ctx.fillStyle = pauseOverlay;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Pause text
            ctx.fillStyle = pauseText;
            ctx.font = 'bold 24px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px Poppins';
            ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 30);
        }
    }
    
    // Draw grid
    function drawGrid() {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let i = 1; i < tileCount; i++) {
            const x = i * tileSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 1; i < tileCount; i++) {
            const y = i * tileSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Draw food
    function drawFood() {
        ctx.fillStyle = foodColor;
        
        // Draw circle for food
        const centerX = food.x * tileSize + tileSize / 2;
        const centerY = food.y * tileSize + tileSize / 2;
        const radius = tileSize / 2.5;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw snake
    function drawSnake() {
        // Draw each segment of the snake
        snake.forEach((segment, index) => {
            // Head has different shade than body
            if (index === 0) {
                ctx.fillStyle = snakeColor;
            } else {
                const alpha = 1 - (index / snake.length) * 0.6;
                ctx.fillStyle = `rgba(102, 187, 106, ${alpha})`;
            }
            
            // Draw rounded rectangle for each segment
            const x = segment.x * tileSize;
            const y = segment.y * tileSize;
            const size = tileSize * 0.9;
            const offset = (tileSize - size) / 2;
            
            roundRect(ctx, x + offset, y + offset, size, size, 4);
        });
    }
    
    // Helper function for drawing rounded rectangles
    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Function to toggle pause state
    function togglePause() {
        if (!running) return;
        
        paused = !paused;
        console.log(paused ? 'Game paused' : 'Game resumed');
        
        // Update pause button appearance
        if (paused) {
            pauseButton.textContent = '▶';
            pauseButton.classList.add('paused');
        } else {
            pauseButton.textContent = 'II';
            pauseButton.classList.remove('paused');
        }
        
        // Redraw to show/hide pause overlay
        drawGame();
    }
    
    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        if (!running) return;
        
        // Prevent scrolling with arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        // Handle pause with spacebar
        if (e.key === ' ') {
            togglePause();
            return;
        }
        
        // Don't change direction if paused
        if (paused) return;
        
        // Change direction
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (direction !== 'down') direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') direction = 'right';
                break;
        }
    });
    
    // Touch controls for mobile
    upButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (running && !paused && direction !== 'down') direction = 'up';
    });
    
    downButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (running && !paused && direction !== 'up') direction = 'down';
    });
    
    leftButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (running && !paused && direction !== 'right') direction = 'left';
    });
    
    rightButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (running && !paused && direction !== 'left') direction = 'right';
    });
    
    // Prevent touch scrolling on game area
    const gameArea = document.querySelector('.game-area');
    gameArea.addEventListener('touchmove', (e) => {
        if (running) e.preventDefault();
    }, { passive: false });
    
    // Start and restart game buttons
    startButton.addEventListener('click', () => {
        startScreen.classList.remove('active');
        setupCanvas();
        initGame();
    });
    
    restartButton.addEventListener('click', () => {
        gameOverModal.classList.remove('active');
        initGame();
    });
    
    // Pause button listener
    pauseButton.addEventListener('click', (e) => {
        e.preventDefault();
        togglePause();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (running) {
            setupCanvas();
            drawGame();
        }
    });
    
    console.log('Snake game setup complete. Click "Start Game" to play!');
}); 