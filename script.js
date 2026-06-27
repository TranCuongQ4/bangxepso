(function() {
  const grid = document.getElementById('gridContainer');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const musicBtn = document.getElementById('musicBtn');

  // Trạng thái game
  let tiles = [];
  let emptyIndex = 15;
  let isGameOver = false;
  
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
      stopMusic(); // Dừng nhạc khi thắng
    }
    return true;
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
    renderGrid();
    const popup = document.getElementById('winOverlay');
    if (popup) popup.remove();
    
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