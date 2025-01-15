class Chess {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.setupBoard();
        this.addEventListeners();
    }

    initializeBoard() {
        return [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
    }

    setupBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.colLetter = letters[col];
                
                if (this.board[row][col]) {
                    square.textContent = this.board[row][col];
                }
                
                boardElement.appendChild(square);
            }
        }
    }

    addEventListeners() {
        document.getElementById('board').addEventListener('click', (e) => {
            const square = e.target.closest('.square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleClick(row, col);
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undoMove();
        });
    }

    handleClick(row, col) {
        const piece = this.board[row][col];

        if (this.selectedPiece) {
            if (this.isValidMove(row, col)) {
                this.movePiece(row, col);
                this.clearHighlights();
                this.selectedPiece = null;
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                this.updateStatus();
            } else if (this.isPieceOfCurrentPlayer(piece)) {
                this.clearHighlights();
                this.selectPiece(row, col);
            }
        } else if (this.isPieceOfCurrentPlayer(piece)) {
            this.selectPiece(row, col);
        }
    }

    isPieceOfCurrentPlayer(piece) {
        if (!piece) return false;
        const whitePieces = '♔♕♖♗♘♙';
        const blackPieces = '♚♛♜♝♞♟';
        return (this.currentPlayer === 'white' && whitePieces.includes(piece)) ||
               (this.currentPlayer === 'black' && blackPieces.includes(piece));
    }

    selectPiece(row, col) {
        this.selectedPiece = { row, col };
        document.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
        this.showValidMoves(row, col);
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'check');
        });
    }

    showValidMoves(row, col) {
        const piece = this.board[row][col];
        this.validMoves = this.getValidMoves(row, col, piece);
        
        this.validMoves.forEach(move => {
            document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`)
                .classList.add('valid-move');
        });
    }

    // Add all the necessary chess logic methods (getValidMoves, movePiece, etc.)
    // from the previous implementation...

    updateStatus() {
        const status = document.getElementById('status');
        if (this.checkForCheckmate()) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            status.textContent = `Checkmate! ${winner} wins!`;
        } else if (this.checkForCheck()) {
            status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
                this.currentPlayer.slice(1)}'s turn - CHECK!`;
        } else {
            status.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + 
                this.currentPlayer.slice(1)}'s turn`;
        }
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.setupBoard();
        this.updateStatus();
        this.updateCapturedPieces();
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        this.board = lastMove.boardState;
        this.currentPlayer = lastMove.player;
        this.setupBoard();
        this.updateStatus();
        this.updateCapturedPieces();
    }
}

// Start the game
const game = new Chess();
game.updateStatus();
