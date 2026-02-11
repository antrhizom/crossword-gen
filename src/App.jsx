import React, { useState, useEffect } from 'react';
import { Share2, Plus, Trash2, Grid, Play } from 'lucide-react';

export default function App() {
  const [words, setWords] = useState([{ word: '', clue: '' }]);
  const [puzzle, setPuzzle] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [mode, setMode] = useState('create'); // 'create', 'solve'
  const [shareLink, setShareLink] = useState('');

  // Load puzzle from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const puzzleData = params.get('puzzle');
    if (puzzleData) {
      try {
        const decoded = JSON.parse(atob(puzzleData));
        setPuzzle(decoded);
        setMode('solve');
      } catch (e) {
        console.error('Fehler beim Laden des Rätsels');
      }
    }
  }, []);

  const addWord = () => {
    setWords([...words, { word: '', clue: '' }]);
  };

  const removeWord = (index) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const updateWord = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = field === 'word' ? value.toUpperCase() : value;
    setWords(newWords);
  };

  const generatePuzzle = () => {
    const validWords = words.filter(w => w.word.length > 1 && w.clue);
    if (validWords.length < 2) {
      alert('Bitte gib mindestens 2 Wörter mit Hinweisen ein!');
      return;
    }

    const grid = createCrossword(validWords);
    if (grid) {
      setPuzzle(grid);
      setMode('solve');
      setUserAnswers({});
    } else {
      alert('Kreuzworträtsel konnte nicht erstellt werden. Versuche andere Wörter!');
    }
  };

  const createCrossword = (wordList) => {
    // Sort words by length (longest first)
    const sorted = [...wordList].sort((a, b) => b.word.length - a.word.length);
    
    const gridSize = 50;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const placed = [];
    
    // Place first word horizontally in the middle
    const firstWord = sorted[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.floor((gridSize - firstWord.word.length) / 2);
    
    for (let i = 0; i < firstWord.word.length; i++) {
      grid[startRow][startCol + i] = firstWord.word[i];
    }
    
    placed.push({
      word: firstWord.word,
      clue: firstWord.clue,
      row: startRow,
      col: startCol,
      direction: 'across',
      number: 1
    });

    let wordNumber = 2;

    // Try to place remaining words
    for (let i = 1; i < sorted.length; i++) {
      const currentWord = sorted[i];
      let bestPlacement = null;
      let maxIntersections = 0;

      // Try to find intersections with placed words
      for (const placedWord of placed) {
        for (let j = 0; j < currentWord.word.length; j++) {
          for (let k = 0; k < placedWord.word.length; k++) {
            if (currentWord.word[j] === placedWord.word[k]) {
              // Try placing perpendicular to the placed word
              const newDirection = placedWord.direction === 'across' ? 'down' : 'across';
              const newRow = placedWord.direction === 'across' 
                ? placedWord.row - j 
                : placedWord.row + k;
              const newCol = placedWord.direction === 'across' 
                ? placedWord.col + k 
                : placedWord.col - j;

              if (canPlaceWord(grid, currentWord.word, newRow, newCol, newDirection, gridSize)) {
                const intersections = countIntersections(grid, currentWord.word, newRow, newCol, newDirection);
                if (intersections > maxIntersections) {
                  maxIntersections = intersections;
                  bestPlacement = { row: newRow, col: newCol, direction: newDirection };
                }
              }
            }
          }
        }
      }

      if (bestPlacement) {
        placeWord(grid, currentWord.word, bestPlacement.row, bestPlacement.col, bestPlacement.direction);
        placed.push({
          word: currentWord.word,
          clue: currentWord.clue,
          row: bestPlacement.row,
          col: bestPlacement.col,
          direction: bestPlacement.direction,
          number: wordNumber++
        });
      }
    }

    // Trim grid to actual content
    const trimmed = trimGrid(grid, placed);
    return trimmed;
  };

  const canPlaceWord = (grid, word, row, col, direction, gridSize) => {
    if (row < 0 || col < 0) return false;
    
    const endRow = direction === 'down' ? row + word.length - 1 : row;
    const endCol = direction === 'across' ? col + word.length - 1 : col;
    
    if (endRow >= gridSize || endCol >= gridSize) return false;

    // Check if cells are available or match
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      
      if (grid[r][c] !== null && grid[r][c] !== word[i]) {
        return false;
      }

      // Check perpendicular cells for conflicts
      if (direction === 'across') {
        if (r > 0 && grid[r - 1][c] !== null && grid[r][c] === null) return false;
        if (r < gridSize - 1 && grid[r + 1][c] !== null && grid[r][c] === null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null && grid[r][c] === null) return false;
        if (c < gridSize - 1 && grid[r][c + 1] !== null && grid[r][c] === null) return false;
      }
    }

    // Check cells before and after word
    if (direction === 'across') {
      if (col > 0 && grid[row][col - 1] !== null) return false;
      if (col + word.length < gridSize && grid[row][col + word.length] !== null) return false;
    } else {
      if (row > 0 && grid[row - 1][col] !== null) return false;
      if (row + word.length < gridSize && grid[row + word.length][col] !== null) return false;
    }

    return true;
  };

  const countIntersections = (grid, word, row, col, direction) => {
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      if (grid[r][c] === word[i]) count++;
    }
    return count;
  };

  const placeWord = (grid, word, row, col, direction) => {
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      grid[r][c] = word[i];
    }
  };

  const trimGrid = (grid, placed) => {
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    placed.forEach(p => {
      minRow = Math.min(minRow, p.row);
      maxRow = Math.max(maxRow, p.direction === 'down' ? p.row + p.word.length - 1 : p.row);
      minCol = Math.min(minCol, p.col);
      maxCol = Math.max(maxCol, p.direction === 'across' ? p.col + p.word.length - 1 : p.col);
    });

    // Add padding
    minRow = Math.max(0, minRow - 1);
    minCol = Math.max(0, minCol - 1);
    maxRow = Math.min(grid.length - 1, maxRow + 1);
    maxCol = Math.min(grid[0].length - 1, maxCol + 1);

    const trimmedGrid = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        row.push(grid[r][c]);
      }
      trimmedGrid.push(row);
    }

    // Adjust word positions
    const adjustedWords = placed.map(p => ({
      ...p,
      row: p.row - minRow,
      col: p.col - minCol
    }));

    // Sort by number
    adjustedWords.sort((a, b) => a.number - b.number);

    return { grid: trimmedGrid, words: adjustedWords };
  };

  const handleCellChange = (wordIndex, letterIndex, value) => {
    const key = `${wordIndex}-${letterIndex}`;
    setUserAnswers({ ...userAnswers, [key]: value.toUpperCase() });
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;

    puzzle.words.forEach((word, wIdx) => {
      for (let i = 0; i < word.word.length; i++) {
        total++;
        const key = `${wIdx}-${i}`;
        if (userAnswers[key] === word.word[i]) {
          correct++;
        }
      }
    });

    alert(`${correct} von ${total} Buchstaben richtig! ${correct === total ? '🎉 Perfekt!' : ''}`);
  };

  const generateShareLink = () => {
    const encoded = btoa(JSON.stringify(puzzle));
    const url = `${window.location.origin}${window.location.pathname}?puzzle=${encoded}`;
    setShareLink(url);
    navigator.clipboard.writeText(url);
    alert('Link wurde in die Zwischenablage kopiert!');
  };

  const resetToCreate = () => {
    setMode('create');
    setPuzzle(null);
    setUserAnswers({});
    setShareLink('');
    window.history.pushState({}, '', window.location.pathname);
  };

  if (mode === 'solve' && puzzle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Kreuzworträtsel</h1>
              <div className="flex gap-2">
                <button
                  onClick={checkAnswers}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Prüfen
                </button>
                <button
                  onClick={generateShareLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Teilen
                </button>
                <button
                  onClick={resetToCreate}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Neues Rätsel
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Crossword Grid */}
              <div className="overflow-auto">
                <div className="inline-block">
                  {puzzle.grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex">
                      {row.map((cell, colIdx) => {
                        // Find if this cell is the start of a word
                        const wordStart = puzzle.words.find(
                          w => w.row === rowIdx && w.col === colIdx
                        );
                        const wordIndex = puzzle.words.findIndex(
                          w => w.row === rowIdx && w.col === colIdx ||
                             (w.direction === 'across' && w.row === rowIdx && colIdx >= w.col && colIdx < w.col + w.word.length) ||
                             (w.direction === 'down' && w.col === colIdx && rowIdx >= w.row && rowIdx < w.row + w.word.length)
                        );
                        
                        let letterIndex = -1;
                        if (wordIndex >= 0) {
                          const word = puzzle.words[wordIndex];
                          if (word.direction === 'across') {
                            letterIndex = colIdx - word.col;
                          } else {
                            letterIndex = rowIdx - word.row;
                          }
                        }

                        const key = `${wordIndex}-${letterIndex}`;

                        return (
                          <div
                            key={colIdx}
                            className={`w-10 h-10 border border-gray-300 relative ${
                              cell === null ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            {wordStart && (
                              <span className="absolute top-0 left-1 text-xs font-bold text-blue-600">
                                {wordStart.number}
                              </span>
                            )}
                            {cell !== null && (
                              <input
                                type="text"
                                maxLength={1}
                                value={userAnswers[key] || ''}
                                onChange={(e) => handleCellChange(wordIndex, letterIndex, e.target.value)}
                                className="w-full h-full text-center font-bold text-lg uppercase border-none outline-none focus:bg-blue-50"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clues */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-700 mb-3">Waagerecht</h2>
                  <div className="space-y-2">
                    {puzzle.words.filter(w => w.direction === 'across').map(word => (
                      <div key={word.number} className="text-gray-700">
                        <span className="font-bold">{word.number}.</span> {word.clue}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-700 mb-3">Senkrecht</h2>
                  <div className="space-y-2">
                    {puzzle.words.filter(w => w.direction === 'down').map(word => (
                      <div key={word.number} className="text-gray-700">
                        <span className="font-bold">{word.number}.</span> {word.clue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Grid className="w-8 h-8 text-purple-600" />
            Kreuzworträtsel-Generator
          </h1>
          <p className="text-gray-600 mb-8">Erstelle dein eigenes Kreuzworträtsel zum Teilen!</p>

          <div className="space-y-4 mb-6">
            {words.map((word, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Wort (z.B. KATZE)"
                    value={word.word}
                    onChange={(e) => updateWord(index, 'word', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  />
                </div>
                <div className="flex-[2]">
                  <input
                    type="text"
                    placeholder="Hinweis (z.B. Haustier mit vier Pfoten)"
                    value={word.clue}
                    onChange={(e) => updateWord(index, 'clue', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {words.length > 1 && (
                  <button
                    onClick={() => removeWord(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addWord}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Wort hinzufügen
            </button>
            <button
              onClick={generatePuzzle}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Grid className="w-5 h-5" />
              Kreuzworträtsel erstellen
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tipps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Gib mindestens 2 Wörter ein (je mehr, desto besser!)</li>
              <li>• Wörter sollten mindestens 2 Buchstaben lang sein</li>
              <li>• Der Algorithmus versucht, die Wörter intelligent zu verknüpfen</li>
              <li>• Nach dem Erstellen kannst du einen Link zum Teilen generieren</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
