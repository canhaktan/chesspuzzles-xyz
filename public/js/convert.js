const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const inputPath = path.join(__dirname, '..', 'lichess_db_puzzle.csv');
const outputPath = path.join(__dirname, '..', 'data', 'puzzles.json');

const MAX_PUZZLES = 20000; // Adjust as needed
const MIN_RATING = 2000;

const puzzles = [];

fs.createReadStream(inputPath)
    .pipe(csv())
    .on('data', (row) => {
        const rating = parseInt(row.Rating);

        if (rating >= MIN_RATING && puzzles.length < MAX_PUZZLES) {
            puzzles.push({
                id: row.PuzzleId,
                fen: row.FEN,
                moves: row.Moves.split(' '),
                rating: rating
            });
        }
    })
    .on('end', () => {
        fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(puzzles, null, 2));
        console.log(`✅ Saved ${puzzles.length} puzzles rated ${MIN_RATING}+ to puzzles.json`);
    });
