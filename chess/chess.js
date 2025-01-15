class ChessGame {
    constructor() {
        this.board = document.getElementById('board');
        this.turnDisplay = document.getElementById('turn-display');
        this.resetButton = document.getElementById('reset-button');
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.validMoves = [];
        
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        // Clear the board
        this.board.innerHTML = '';
        this.gameBoard = this.createInitialBoard();
        
        // Create squares and pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.gameBoard[row][col];
                if (piece) {
                    square.innerHTML = this.getPieceSymbol(piece);
                }
                
                this.board.appendChild(square);
            }
        }
    }

    createInitialBoard() {
        return [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            Array(8).fill(null),
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
    }

    getPieceSymbol(piece) {
        const symbols = {
            'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
            'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
        };
        return symbols[piece];
    }

    setupEventListeners() {
        this.board.addEventListener('click', (e) => this.handleSquareClick(e));
        this.resetButton.addEventListener('click', () => this.initializeBoard());
    }

    handleSquareClick(e) {
        const square = e.target.closest('.square');
        if (!square) return;

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = this.gameBoard[row][col];

        // Clear previous selections
        this.clearHighlights();

        // If no piece is selected and clicked on a piece
        if (!this.selectedPiece && piece && this.isPieceOwner(piece)) {
            this.selectedPiece = { row, col, piece };
            square.classList.add('selected');
            this.showValidMoves(row, col, piece);
        }
        // If a piece is selected and clicking on a valid move
        else if (this.selectedPiece && this.isValidMove(row, col)) {
            this.movePiece(row, col);
            this.selectedPiece = null;
            this.switchTurn();
        }
        // Deselect piece
        else {
            this.selectedPiece = null;
        }
    }

    isPieceOwner(piece) {
        return piece && piece[0] === (this.currentPlayer === 'white' ? 'w' : 'b');
    }

    showValidMoves(row, col, piece) {
        this.validMoves = this.calculateValidMoves(row, col, piece);
        this.validMoves.forEach(move => {
            const square = this.getSquare(move.row, move.col);
            square.classList.add('valid-move');
        });
    }

    calculateValidMoves(row, col, piece) {
        const moves = [];
        const type = piece[1];
        
        switch(type) {
            case 'P':
                this.calculatePawnMoves(row, col, moves);
                break;
            case 'R':
                this.calculateRookMoves(row, col, moves);
                break;
            case 'N':
                this.calculateKnightMoves(row, col, moves);
                break;
            case 'B':
                this.calculateBishopMoves(row, col, moves);
                break;
            case 'Q':
                this.calculateQueenMoves(row, col, moves);
                break;
            case 'K':
                this.calculateKingMoves(row, col, moves);
                break;
        }
        
        return moves;
    }

    calculatePawnMoves(row, col, moves) {
        const direction = this.currentPlayer === 'white' ? -1 : 1;
        const startRow = this.currentPlayer === 'white' ? 6 : 1;

        // Forward move
        if (!this.gameBoard[row + direction]?.[col]) {
            moves.push({ row: row + direction, col });
            // Double move from start
            if (row === startRow && !this.gameBoard[row + 2 * direction]?.[col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Captures
        [-1, 1].forEach(offset => {
            const newCol = col + offset;
            if (this.isValidPosition(row + direction, newCol)) {
                const targetPiece = this.gameBoard[row + direction][newCol];
                if (targetPiece && targetPiece[0] !== (this.currentPlayer === 'white' ? 'w' : 'b')) {
                    moves.push({ row: row + direction, col: newCol });
                }
            }
        });
    }

    calculateRookMoves(row, col, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateBishopMoves(row, col, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateQueenMoves(row, col, moves) {
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        this.calculateLinearMoves(row, col, moves, directions);
    }

    calculateKnightMoves(row, col, moves) {
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        knightMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.gameBoard[newRow][newCol];
                if (!targetPiece || targetPiece[0] !== (this.currentPlayer === 'white' ? 'w' : 'b')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    calculateKingMoves(row, col, moves) {
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        kingMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.gameBoard[newRow][newCol];
                if (!targetPiece || targetPiece[0] !== (this.currentPlayer === 'white' ? 'w' : 'b')) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
    }

    calculateLinearMoves(row, col, moves, directions) {
        directions.forEach(([rowDir, colDir]) => {
            let newRow = row + rowDir;
            let newCol = col + colDir;
            
            while (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.gameBoard[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece[0] !== (this.currentPlayer === 'white' ? 'w' : 'b')) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += rowDir;
                newCol += colDir;
            }
        });
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isValidMove(row, col) {
        return this.validMoves.some(move => move.row === row && move.col === col);
    }

    movePiece(toRow, toCol) {
        const { row: fromRow, col: fromCol } = this.selectedPiece;
        
        // Update the board array
        this.gameBoard[toRow][toCol] = this.gameBoard[fromRow][fromCol];
        this.gameBoard[fromRow][fromCol] = null;
        
        // Update the DOM
        const fromSquare = this.getSquare(fromRow, fromCol);
        const toSquare = this.getSquare(toRow, toCol);
        toSquare.innerHTML = fromSquare.innerHTML;
        fromSquare.innerHTML = '';
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.turnDisplay.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });
    }

    getSquare(row, col) {
        return this.board.children[row * 8 + col];
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new ChessGame();
});
