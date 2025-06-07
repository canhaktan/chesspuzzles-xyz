document.addEventListener('DOMContentLoaded', function () {
    const menuGame = new Chess();
    const menuBoard = Chessboard('menuChessBoard', {
        position: menuGame.fen(),
        draggable: true,
        pieceTheme: 'public/img/chesspieces/wikipedia/{piece}.png',
        onDrop: function (source, target) {
            const move = menuGame.move({ from: source, to: target, promotion: 'q' });
            if (move === null) return 'snapback';
        },
        onSnapEnd: function () {
            menuBoard.position(menuGame.fen());
        }
    });

    let currentPuzzle = null;
    let puzzleGame = null;
    let puzzleBoard = null;
    let moveIndex = 0;
    let timerInterval = null;
    let startTime = 0;
    let notationMoves = [];
    let initialMoveIsBlack = false;

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('puzzleTimer').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function resetTimer() {
        stopTimer();
        document.getElementById('puzzleTimer').textContent = 'Time: 0:00';
    }

    function updateNotationDisplay() {
        const notationEl = document.getElementById('puzzleNotation');
        notationEl.innerHTML = '';

        let i = 0;
        let turn = 1;

        if (initialMoveIsBlack) {
            // First row: only black move
            const row = document.createElement('div');
            row.textContent = `${turn}... ${notationMoves[i] || ''}`;
            notationEl.appendChild(row);
            i += 1;
            turn++;
        }

        while (i < notationMoves.length) {
            const white = notationMoves[i] || '';
            const black = notationMoves[i + 1] || '';
            const row = document.createElement('div');
            row.textContent = `${turn}. ${white}   ${black}`;
            notationEl.appendChild(row);
            i += 2;
            turn++;
        }
    }


    function puzzleOnDragStart(source, piece) {
        if (puzzleGame.game_over()) return false;
        const turn = puzzleGame.turn();
        const isWhiteTurn = turn === 'w';
        const isWhitePiece = piece.startsWith('w');
        const isBlackPiece = piece.startsWith('b');
        if ((isWhiteTurn && isBlackPiece) || (!isWhiteTurn && isWhitePiece)) {
            return false;
        }
    }

    function puzzleOnDrop(source, target) {
        const userMoveStr = `${source}${target}`;
        const expectedUserMove = currentPuzzle.moves[moveIndex];

        if (userMoveStr !== expectedUserMove) {
            document.getElementById('moveStatus').textContent = 'Incorrect move, try again';
            document.getElementById('moveStatus').style.color = 'red';
            return 'snapback';
        }

        const userMove = puzzleGame.move({ from: source, to: target, promotion: 'q' });
        notationMoves.push(userMove.san);
        updateNotationDisplay();

        document.getElementById('moveStatus').textContent = 'Correct :)';
        document.getElementById('moveStatus').style.color = 'green';

        moveIndex++;
        puzzleBoard.position(puzzleGame.fen());

        if (moveIndex < currentPuzzle.moves.length) {
            const replyMoveStr = currentPuzzle.moves[moveIndex];
            setTimeout(() => {
                const from = replyMoveStr.substring(0, 2);
                const to = replyMoveStr.substring(2, 4);
                const replyMove = puzzleGame.move({ from, to, promotion: 'q' });
                puzzleBoard.move(`${from}-${to}`);
                notationMoves.push(replyMove.san);
                updateNotationDisplay();
                moveIndex++;

                if (moveIndex >= currentPuzzle.moves.length) {
                    setTimeout(() => {
                        document.getElementById('moveStatus').textContent = '✅ Puzzle solved!';
                        document.getElementById('moveStatus').style.color = 'green';
                        stopTimer();
                        document.getElementById('nextBtn').style.display = 'block';
                    }, 300);
                }
            }, 400);
        } else {
            setTimeout(() => {
                document.getElementById('moveStatus').textContent = '✅ Puzzle solved!';
                document.getElementById('moveStatus').style.color = 'green';
                stopTimer();
                document.getElementById('nextBtn').style.display = 'block';
            }, 300);
        }
    }

    function puzzleOnSnapEnd() {
        puzzleBoard.position(puzzleGame.fen());
    }

    function loadRandomPuzzle() {
        fetch('public/data/puzzles.json')
            .then(res => res.json())
            .then(puzzles => {
                currentPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
                puzzleGame = new Chess(currentPuzzle.fen);
                moveIndex = 0;
                notationMoves = [];
                updateNotationDisplay();

                const firstMove = currentPuzzle.moves[moveIndex];
                const from = firstMove.substring(0, 2);
                const to = firstMove.substring(2, 4);
                const pieceAtSource = puzzleGame.get(from);
                const isWhiteMove = pieceAtSource && pieceAtSource.color === 'w';
                const orientation = isWhiteMove ? 'black' : 'white';
                initialMoveIsBlack = !isWhiteMove;

                const initialMove = puzzleGame.move({ from, to, promotion: 'q' });
                notationMoves.push(initialMove.san);
                updateNotationDisplay();
                moveIndex++;

                puzzleBoard = Chessboard('puzzleChessBoard', {
                    position: currentPuzzle.fen,
                    orientation: orientation,
                    draggable: true,
                    pieceTheme: 'public/img/chesspieces/wikipedia/{piece}.png',
                    onDragStart: puzzleOnDragStart,
                    onDrop: puzzleOnDrop,
                    onSnapEnd: puzzleOnSnapEnd
                });

                document.getElementById('puzzleRating').textContent = `Rating: ${currentPuzzle.rating}`;
                document.getElementById('moveStatus').textContent = '';
                document.getElementById('nextBtn').style.display = 'none';
                resetTimer();
                startTimer();

                setTimeout(() => {
                    puzzleBoard.move(`${from}-${to}`);
                }, 300);

                // Show "Show on Lichess" button
                const lichessBtn = document.getElementById('lichessBtn');
                lichessBtn.style.display = 'block';
                lichessBtn.onclick = () => {
                    if (currentPuzzle && currentPuzzle.id) {
                        window.open(`https://lichess.org/training/${currentPuzzle.id}`, '_blank');
                    }
                };

                console.log("🧩 Puzzle loaded:", currentPuzzle);

            });
    }

    document.getElementById('startBtn').addEventListener('click', function () {
        document.getElementById('menuChessBoard').style.display = 'none';
        document.querySelector('.menu-buttons').style.display = 'none';
        document.getElementById('puzzleContainer').style.display = 'flex';
        loadRandomPuzzle();
    });

    document.getElementById('nextBtn').addEventListener('click', function () {
        loadRandomPuzzle();
    });

    document.getElementById('loginBtn').addEventListener('click', function () {
        alert('Login clicked (coming soon)');
    });

    document.getElementById('aboutBtn').addEventListener('click', function () {
        alert('This site gives you real puzzles from Lichess to solve!');
    });
});
