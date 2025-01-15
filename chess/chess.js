class ChessGame {
    constructor() {
        this.board = document.getElementById('board');
        this.turnDisplay = document.getElementById('turn-display');
        this.resetButton = document.getElementById('reset-button');
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.validMoves = [];
        this.gameOver = false;
        this.moveHistory = []; // For tracking repetition
        this.kings = {
            white: { row: 7, col: 4, hasMoved: false },
            black: { row: 0, col: 4, hasMoved: false }
        };
        this.rooks = {
            white: { 
                kingside: { hasMoved: false },
                queenside: { hasMoved: false }
            },
            black: {
                kingside: { hasMoved: false }, 
                queenside: { hasMoved: false }
            }
        };
        this.lastPawnMove = null; // For en passant
        
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        // Clear the board
        this.board.innerHTML = '';
        this.gameBoard = this.createInitialBoard();
        this.gameOver = false;
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.kings = {
            white: { row: 7, col: 4, hasMoved: false },
            black: { row: 0, col: 4, hasMoved: false }
        };
        this.rooks = {
            white: { 
                kingside: { hasMoved: false },
                queenside: { hasMoved: false }
            },
            black: {
                kingside: { hasMoved: false },
                queenside: { hasMoved: false }
            }
        };
        this.lastPawnMove = null;
        this.turnDisplay.textContent = "White's Turn";
        
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
        
        // Add resign button
        const resignButton = document.createElement('button');
        resignButton.textContent = 'Resign';
        resignButton.addEventListener('click', () => this.resign());
        this.resetButton.parentNode.appendChild(resignButton);
    }

    async handleSquareClick(e) {
        if (this.gameOver) return;
        
        // Find the square element whether clicking on the square or the piece
        const square = e.target.classList.contains('square') ? 
            e.target : 
            e.target.closest('.square');
        
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
            await this.movePiece(row, col);
            this.selectedPiece = null;
            
            // Check game state after move
            if (this.isCheckmate()) {
                this.endGame(`Checkmate! ${this.currentPlayer === 'white' ? 'Black' : 'White'} wins!`);
            } else if (this.isCheck()) {
                this.turnDisplay.textContent = `Check! ${this.currentPlayer}'s Turn`;
            } else if (this.isDrawByRepetition()) {
                this.endGame("Draw by repetition!");
            } else {
                this.switchTurn();
            }
        }
        // Deselect piece
        else {
            this.selectedPiece = null;
        }
    }

    isCheck() {
        const kingPos = this.kings[this.currentPlayer];
        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check all opponent pieces for attacks on king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameBoard[row][col];
                if (piece && piece[0] === opponent[0]) {
                    const moves = this.calculateValidMoves(row, col, piece, false);
                    if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isCheckmate() {
        if (!this.isCheck()) return false;
        
        // Try all possible moves for all pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.gameBoard[row][col];
                if (piece && this.isPieceOwner(piece)) {
                    const moves = this.calculateValidMoves(row, col, piece, true);
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    isDrawByRepetition() {
        const currentPosition = JSON.stringify(this.gameBoard);
        const occurrences = this.moveHistory.filter(pos => pos === currentPosition).length;
        return occurrences >= 3;
    }

    async makeMove(fromRow, fromCol, toRow, toCol, isSpecialMove = false) {
        const piece = this.gameBoard[fromRow][fromCol];
        
        // Handle castling
        if (piece[1] === 'K' && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol > fromCol;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            const rookRow = fromRow;
            
            // Move rook
            this.gameBoard[rookRow][rookToCol] = this.gameBoard[rookRow][rookFromCol];
            this.gameBoard[rookRow][rookFromCol] = null;
            
            // Update DOM for rook
            const rookFromSquare = this.getSquare(rookRow, rookFromCol);
            const rookToSquare = this.getSquare(rookRow, rookToCol);
            rookToSquare.innerHTML = rookFromSquare.innerHTML;
            rookFromSquare.innerHTML = '';
        }
        
        // Handle en passant capture
        if (piece[1] === 'P' && Math.abs(fromCol - toCol) === 1 && !this.gameBoard[toRow][toCol]) {
            const capturedPawnRow = fromRow;
            this.gameBoard[capturedPawnRow][toCol] = null;
            this.getSquare(capturedPawnRow, toCol).innerHTML = '';
        }
        
        // Update kings position and movement status if king is moved
        if (piece[1] === 'K') {
            this.kings[this.currentPlayer].row = toRow;
            this.kings[this.currentPlayer].col = toCol;
            this.kings[this.currentPlayer].hasMoved = true;
        }
        
        // Update rook movement status
        if (piece[1] === 'R') {
            const side = fromCol === 0 ? 'queenside' : 'kingside';
            this.rooks[this.currentPlayer][side].hasMoved = true;
        }
        
        // Track pawn moves for en passant
        if (piece[1] === 'P' && Math.abs(fromRow - toRow) === 2) {
            this.lastPawnMove = {
                row: toRow,
                col: toCol,
                player: this.currentPlayer
            };
        } else {
            this.lastPawnMove = null;
        }
        
        this.gameBoard[toRow][toCol] = piece;
        this.gameBoard[fromRow][fromCol] = null;
        
        // Handle pawn promotion
        if (piece[1] === 'P' && (toRow === 0 || toRow === 7) && !isSpecialMove) {
            const promotedPiece = await this.promotePawn(this.currentPlayer);
            this.gameBoard[toRow][toCol] = promotedPiece;
            this.getSquare(toRow, toCol).innerHTML = this.getPieceSymbol(promotedPiece);
        }
    }

    async promotePawn(player) {
        const color = player[0];
        return new Promise(resolve => {
            const pieces = ['Q', 'R', 'B', 'N'];
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border: 2px solid black;
                z-index: 1000;
            `;
            
            pieces.forEach(piece => {
                const button = document.createElement('button');
                button.innerHTML = this.getPieceSymbol(`${color}${piece}`);
                button.style.fontSize = '40px';
                button.style.margin = '10px';
                button.onclick = () => {
                    document.body.removeChild(modal);
                    resolve(`${color}${piece}`);
                };
                modal.appendChild(button);
            });
            
            document.body.appendChild(modal);
        });
    }

    async movePiece(toRow, toCol) {
        const { row: fromRow, col: fromCol } = this.selectedPiece;
        
        // Save position for repetition checking
        this.moveHistory.push(JSON.stringify(this.gameBoard));
        
        // Update the board array
        await this.makeMove(fromRow, fromCol, toRow, toCol);
        
        // Update the DOM
        const fromSquare = this.getSquare(fromRow, fromCol);
        const toSquare = this.getSquare(toRow, toCol);
        toSquare.innerHTML = fromSquare.innerHTML;
        fromSquare.innerHTML = '';
    }

    resign() {
        const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
        this.endGame(`${this.currentPlayer} resigns! ${winner} wins!`);
    }

    endGame(message) {
        this.gameOver = true;
        this.turnDisplay.textContent = message;
        this.resetButton.style.display = 'block';
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

    isPieceOwner(piece) {
        return piece && piece[0] === (this.currentPlayer === 'white' ? 'w' : 'b');
    }

    showValidMoves(row, col, piece) {
        this.validMoves = this.calculateValidMoves(row, col, piece, true);
        this.validMoves.forEach(move => {
            const square = this.getSquare(move.row, move.col);
            square.classList.add('valid-move');
        });
    }

    calculateValidMoves(row, col, piece, checkCastling = true) {
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
                this.calculateKingMoves(row, col, moves, checkCastling);
                break;
        }
        
        // Filter moves that would put or leave king in check
        return moves.filter(move => {
            const savedBoard = JSON.parse(JSON.stringify(this.gameBoard));
            const savedKings = JSON.parse(JSON.stringify(this.kings));
            const savedRooks = JSON.parse(JSON.stringify(this.rooks));
            const savedLastPawnMove = this.lastPawnMove;
            
            this.makeMove(row, col, move.row, move.col, true);
            const inCheck = this.isCheck();
            
            this.gameBoard = savedBoard;
            this.kings = savedKings;
            this.rooks = savedRooks;
            this.lastPawnMove = savedLastPawnMove;
            
            return !inCheck;
        });
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

        // Regular captures
        [-1, 1].forEach(offset => {
            const newCol = col + offset;
            if (this.isValidPosition(row + direction, newCol)) {
                const targetPiece = this.gameBoard[row + direction][newCol];
                if (targetPiece && targetPiece[0] !== (this.currentPlayer === 'white' ? 'w' : 'b')) {
                    moves.push({ row: row + direction, col: newCol });
                }
            }
        });

        // En passant
        if (this.lastPawnMove && 
            this.lastPawnMove.player !== this.currentPlayer && 
            row === (this.currentPlayer === 'white' ? 3 : 4)) {
            [-1, 1].forEach(offset => {
                if (col + offset === this.lastPawnMove.col) {
                    moves.push({ row: row + direction, col: this.lastPawnMove.col });
                }
            });
        }
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

    calculateKingMoves(row, col, moves, checkCastling) {
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

        // Castling
        if (checkCastling && !this.kings[this.currentPlayer].hasMoved && !this.isCheck()) {
            // Kingside castling
            if (!this.rooks[this.currentPlayer].kingside.hasMoved &&
                !this.gameBoard[row][5] && !this.gameBoard[row][6]) {
                // Check if squares are under attack
                let canCastle = true;
                for (let testCol = 4; testCol <= 6; testCol++) {
                    const savedBoard = JSON.parse(JSON.stringify(this.gameBoard));
                    this.gameBoard[row][testCol] = this.gameBoard[row][4];
                    this.gameBoard[row][4] = null;
                    if (this.isCheck()) {
                        canCastle = false;
                    }
                    this.gameBoard = savedBoard;
                }
                if (canCastle) {
                    moves.push({ row, col: 6 });
                }
            }
            
            // Queenside castling
            if (!this.rooks[this.currentPlayer].queenside.hasMoved &&
                !this.gameBoard[row][3] && !this.gameBoard[row][2] && !this.gameBoard[row][1]) {
                // Check if squares are under attack
                let canCastle = true;
                for (let testCol = 4; testCol >= 2; testCol--) {
                    const savedBoard = JSON.parse(JSON.stringify(this.gameBoard));
                    this.gameBoard[row][testCol] = this.gameBoard[row][4];
                    this.gameBoard[row][4] = null;
                    if (this.isCheck()) {
                        canCastle = false;
                    }
                    this.gameBoard = savedBoard;
                }
                if (canCastle) {
                    moves.push({ row, col: 2 });
                }
            }
        }
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
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new ChessGame();
});
