let board = Chessboard('board', {
    position: 'start'
});

document.getElementById('load-puzzle').addEventListener('click', () => {
    // Example puzzle position (white to play)
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 4';
    board.position(fen);
});
