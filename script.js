(function() {
  const grid = document.getElementById('gridContainer');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const supportBtn = document.getElementById('supportBtn');
  const musicBtn = document.getElementById('musicBtn');

  // Trạng thái game
  let tiles = [];
  let emptyIndex = 15;
  let isGameOver = false;
  let supportCount = 3;
  
  // Trạng thái nhạc
  let audio = null;
  let isMusicPlaying = false;

  // Khởi tạo audio
  function initAudio() {
    try {
      audio = new Audio('xepso.mp3');
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      // Xử lý lỗi khi không tìm thấy file
      audio.addEventListener('error', function(e) {
        console.log('⚠️ Không tìm thấy file xepso.mp3');
        musicBtn.style.opacity = '0.3';
        musicBtn.disabled = true;
      });
    } catch (e) {
      console.log('⚠️ Lỗi khởi tạo audio:', e);
    }
  }

  // Bật/tắt nhạc
  function toggleMusic() {
    if (!audio) {
      initAudio();
      if (!audio) return;
    }

    if (isMusicPlaying) {
      audio.pause();
      isMusicPlaying = false;
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    } else {
      // Thử phát nhạc
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isMusicPlaying = true;
          musicBtn.classList.remove('muted');
          musicBtn.textContent = '🔊';
        }).catch(error => {
          console.log('⚠️ Không thể phát nhạc:', error);
          // Thử lại sau 1 giây
          setTimeout(() => {
            audio.play().then(() => {
              isMusicPlaying = true;
              musicBtn.classList.remove('muted');
              musicBtn.textContent = '🔊';
            }).catch(() => {});
          }, 1000);
        });
      }
    }
  }

  // Dừng nhạc
  function stopMusic() {
    if (audio && isMusicPlaying) {
      audio.pause();
      isMusicPlaying = false;
      musicBtn.classList.add('muted');
      musicBtn.textContent = '🔇';
    }
  }

  // Khởi tạo trạng thái đúng (1..15, 0 cuối)
  function initSolvedState() {
    const arr = [];
    for (let i = 1; i <= 15; i++) arr.push(i);
    arr.push(0);
    return arr;
  }

  // Kiểm tra trạng thái đúng
  function isSolved(arr) {
    for (let i = 0; i < 15; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return arr[15] === 0;
  }

  // Lấy các vị trí kế bên ô trống
  function getNeighbors(idx) {
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const neighbors = [];
    if (row > 0) neighbors.push(idx - 4);
    if (row < 3) neighbors.push(idx + 4);
    if (col > 0) neighbors.push(idx - 1);
    if (col < 3) neighbors.push(idx + 1);
    return neighbors;
  }

  // Tìm bước đi tiếp theo bằng BFS
  function findNextMove() {
    if (isSolved(tiles)) {
      return null;
    }

    const target = initSolvedState();
    const targetStr = target.join(',');

    const queue = [];
    const visited = new Set();
    
    const startState = tiles.slice();
    const startStr = startState.join(',');
    
    queue.push({
      state: startState,
      emptyPos: emptyIndex,
      path: []
    });
    visited.add(startStr);

    let maxSteps = 1000;
    let stepCount = 0;

    while (queue.length > 0 && stepCount < maxSteps) {
      stepCount++;
      const current = queue.shift();
      const currentState = current.state;
      const currentEmpty = current.emptyPos;
      const path = current.path;

      const neighbors = getNeighbors(currentEmpty);
      
      for (const neighbor of neighbors) {
        const newState = currentState.slice();
        newState[currentEmpty] = newState[neighbor];
        newState[neighbor] = 0;
        
        const stateStr = newState.join(',');
        
        if (stateStr === targetStr) {
          if (path.length > 0) {
            return path[0];
          } else {
            return { from: neighbor, to: currentEmpty };
          }
        }
        
        if (!visited.has(stateStr)) {
          visited.add(stateStr);
          const newPath = path.slice();
          newPath.push({ from: neighbor, to: currentEmpty });
          queue.push({
            state: newState,
            emptyPos: currentEmpty,
            path: newPath
          });
        }
      }
    }

    return findGreedyMove();
  }

  // Phương pháp đơn giản: tìm số đúng vị trí gần nhất
  function findGreedyMove() {
    const neighbors = getNeighbors(emptyIndex);
    let bestMove = null;
    let bestScore = -1;

    for (const neighbor of neighbors) {
      const value = tiles[neighbor];
      if (value === 0) continue;
      
      const correctPos = value - 1;
      const currentPos = neighbor;
      const distanceToCorrect = Math.abs(
        Math.floor(currentPos / 4) - Math.floor(correctPos / 4)
      ) + Math.abs((currentPos % 4) - (correctPos % 4));
      
      const score = 10 - distanceToCorrect;
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = { from: neighbor, to: emptyIndex };
      }
    }
    
    if (!bestMove && neighbors.length > 0) {
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (tiles[randomNeighbor] !== 0) {
        bestMove = { from: randomNeighbor, to: emptyIndex };
      }
    }
    
    return bestMove;
  }

  // Di chuyển ô số vào ô trống
  function moveTile(tileIndex) {
    if (isGameOver) return false;
    if (tileIndex === emptyIndex) return false;

    const neighbors = getNeighbors(emptyIndex);
    if (!neighbors.includes(tileIndex)) return false;

    tiles[emptyIndex] = tiles[tileIndex];
    tiles[tileIndex] = 0;
    emptyIndex = tileIndex;
    renderGrid();

    if (isSolved(tiles)) {
      isGameOver = true;
      showWinPopup();
      supportBtn.disabled = true;
      stopMusic(); // Dừng nhạc khi thắng
    }
    return true;
  }

  // Hàm hỗ trợ 1 bước
  function supportMove() {
    if (isGameOver) {
      showErrorPopup('Trò chơi đã kết thúc! Hãy nhấn "Xếp Số" để chơi ván mới.');
      return;
    }

    if (supportCount <= 0) {
      showErrorPopup('Không hỗ trợ quá 3 lần nhé bạn ơi! 😅');
      return;
    }

    if (isSolved(tiles)) {
      showErrorPopup('Bạn đã hoàn thành rồi! 🎉');
      return;
    }

    const solution = findNextMove();
    
    if (!solution) {
      const neighbors = getNeighbors(emptyIndex);
      if (neighbors.length > 0) {
        const randomIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (tiles[randomIdx] !== 0) {
          tiles[emptyIndex] = tiles[randomIdx];
          tiles[randomIdx] = 0;
          emptyIndex = randomIdx;
          supportCount--;
          updateSupportButton();
          renderGrid();
          
          if (isSolved(tiles)) {
            isGameOver = true;
            showWinPopup();
            supportBtn.disabled = true;
            stopMusic();
          }
          return;
        }
      }
      showErrorPopup('Không tìm thấy bước đi hợp lệ!');
      return;
    }

    const from = solution.from;
    const to = solution.to;
    
    tiles[to] = tiles[from];
    tiles[from] = 0;
    emptyIndex = from;
    
    supportCount--;
    updateSupportButton();
    
    renderGrid();

    if (isSolved(tiles)) {
      isGameOver = true;
      showWinPopup();
      supportBtn.disabled = true;
      stopMusic();
    }
  }

  // Cập nhật trạng thái nút hỗ trợ
  function updateSupportButton() {
    if (supportCount <= 0 || isGameOver) {
      supportBtn.disabled = true;
    } else {
      supportBtn.disabled = false;
    }
    supportBtn.textContent = `Hỗ Trợ (${supportCount})`;
  }

  // Hiển thị popup lỗi
  function showErrorPopup(message) {
    const oldPopup = document.querySelector('.error-overlay');
    if (oldPopup) oldPopup.remove();

    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';
    overlay.id = 'errorOverlay';

    const box = document.createElement('div');
    box.className = 'error-box';

    const msg = document.createElement('p');
    msg.textContent = message;

    const okBtn = document.createElement('button');
    okBtn.className = 'btn-ok';
    okBtn.textContent = 'OK';
    okBtn.addEventListener('click', function() {
      overlay.remove();
    });

    box.appendChild(msg);
    box.appendChild(okBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // Render grid
  function renderGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const val = tiles[i];
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (val === 0) {
        tile.classList.add('empty');
        tile.textContent = '';
      } else {
        tile.textContent = val;
      }
      tile.dataset.index = i;
      tile.addEventListener('click', tileClickHandler);
      grid.appendChild(tile);
    }
  }

  // Xử lý click vào ô
  function tileClickHandler(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    moveTile(index);
  }

  // Random trạng thái có thể giải được
  function shuffleBoard() {
    if (isGameOver) {
      isGameOver = false;
    }

    supportCount = 3;
    supportBtn.disabled = false;
    updateSupportButton();

    tiles = initSolvedState();
    emptyIndex = 15;

    const steps = 200 + Math.floor(Math.random() * 150);
    let lastMove = -1;
    for (let s = 0; s < steps; s++) {
      const neighbors = getNeighbors(emptyIndex);
      const filtered = neighbors.filter(idx => idx !== lastMove);
      const available = filtered.length > 0 ? filtered : neighbors;
      const randomNeighbor = available[Math.floor(Math.random() * available.length)];
      
      const prevEmpty = emptyIndex;
      tiles[prevEmpty] = tiles[randomNeighbor];
      tiles[randomNeighbor] = 0;
      emptyIndex = randomNeighbor;
      lastMove = prevEmpty;
    }

    if (isSolved(tiles)) {
      for (let s = 0; s < 30; s++) {
        const neighbors = getNeighbors(emptyIndex);
        const randNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        tiles[emptyIndex] = tiles[randNeighbor];
        tiles[randNeighbor] = 0;
        emptyIndex = randNeighbor;
      }
    }

    isGameOver = false;
    renderGrid();
    
    const popup = document.getElementById('winOverlay');
    if (popup) popup.remove();
    const errorPopup = document.getElementById('errorOverlay');
    if (errorPopup) errorPopup.remove();
    
    // Bật nhạc khi bắt đầu ván mới (nếu đã bật trước đó)
    if (isMusicPlaying) {
      audio.play().catch(() => {});
    }
  }

  // Hiển thị popup chiến thắng
  function showWinPopup() {
    const oldPopup = document.querySelector('.win-overlay');
    if (oldPopup) oldPopup.remove();

    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    overlay.id = 'winOverlay';

    const box = document.createElement('div');
    box.className = 'win-box';

    const msg = document.createElement('p');
    msg.textContent = '🎉 Chúc Mừng Hoàn Thành Xếp Trật Tự 🎉';

    const okBtn = document.createElement('button');
    okBtn.className = 'btn-ok';
    okBtn.textContent = 'OK';
    okBtn.addEventListener('click', function() {
      overlay.remove();
    });

    box.appendChild(msg);
    box.appendChild(okBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // Khởi tạo game lần đầu
  function initGame() {
    tiles = initSolvedState();
    emptyIndex = 15;
    isGameOver = false;
    supportCount = 3;
    renderGrid();
    updateSupportButton();
    const popup = document.getElementById('winOverlay');
    if (popup) popup.remove();
    const errorPopup = document.getElementById('errorOverlay');
    if (errorPopup) errorPopup.remove();
    
    // Khởi tạo audio
    initAudio();
    
    // Mặc định bật nhạc (nếu có file)
    setTimeout(() => {
      if (audio) {
        toggleMusic();
      }
    }, 500);
  }

  // Sự kiện nút Xếp Số
  shuffleBtn.addEventListener('click', function() {
    shuffleBoard();
  });

  // Sự kiện nút Hỗ Trợ
  supportBtn.addEventListener('click', function() {
    supportMove();
  });

  // Sự kiện nút Nhạc
  musicBtn.addEventListener('click', function() {
    toggleMusic();
  });

  // Chặn chuột phải (không chặn F12)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Khởi chạy
  initGame();
})();