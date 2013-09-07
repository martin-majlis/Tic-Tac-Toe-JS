var TicTacToe = {
	Game: function() {
		var self = {			
			players: [],
			playersCount: 0,
			board: null,
			turn: 0,

			addPlayer: function(player) {
				var sign = self.board.signs[self.playersCount++];
				self.players[sign] = player;
				player.init(self.board, sign);
			},
			fieldMapping: function() {
				console.error("Not implemented");
			},
			setBoard: function(board) {
				self.board = board;
			},
			
			start: function() {
				var maxTurns = self.board.getDimension() * self.board.getDimension(); 
				do {
					var sign = self.board.getNextSign();
					var player = self.players[sign];
					player.turn(self.board);
					console.debug(self.turn + ":\n" + self.board.toString());
					self.turn++;
				} while ( ( ! self.board.isOver(sign) ) && self.turn < maxTurns );

				var msg = "Draw";
				if ( self.turn < maxTurns ) {
					msg = "Player " + sign + " win!!!";
				}
				self.report(msg);
			}
		}

		return self;
	},

	Board: function() {
		var self = {
			board: [],
			SIZE: 3,
			_realSize: null,
			EMPTY: "0",
			turn: 0,
			signs: [],

			init: function() {
				self.board = [];
				self._realSize = self.SIZE + 2;
				for (var i = 0; i < self._realSize; i++) {
					self.board.push([]);
					for(var j = 0; j < self._realSize; j++) {
						self.board[i].push(self.EMPTY);
					}
				}
			},

			setSigns: function(signs) {
				self.signs = signs;
			},

			toString: function() {
				var output = "";
				for (var i = 1; i <= self.SIZE; i++) {
					for(var j = 1; j <= self.SIZE; j++) {
						output += self.board[i][j];
					}
					output += "\n";
				}
				return output;
			},
	
			isOver: function(sign) {
				var result = false;
				var row = 0;
				while ( ! result && row < self.SIZE ) {
					result = self._checkRow(row, sign);
					row++;
				}
				var column = 0;
				while ( ! result && column < self.SIZE ) {
					result = self._checkColumn(column, sign);
					column++;
				}
				if (!result) {
					result = self._checkDiagonals(sign);
				}
				return result;						
			},

			_checkRow: function(row, sign) {
				var result = false;
				var pos = 1;
				while (self.board[row + 1][pos] == sign) {
					pos++;
				}
				var result = pos > self.SIZE;
//				console.debug("Check row " + row + " and sign " + sign + " = " + result);
				return result;			},

			_checkColumn: function(column, sign) {
				var result = false;
				var pos = 1;
				while (self.board[pos][column + 1] == sign) {
					pos++;
				}
				var result = pos > self.SIZE;
//				console.debug("Check column " + column + " and sign " + sign + " = " + result);
				return result;
			},

			_checkDiagonals: function(sign) {
				var diag1 = true;
				var diag2 = true;
				var expSum = self.SIZE + 1;
				for (var i = 1; i <= self.SIZE; i++) {
					diag1 = diag1 && self.board[i][i] == sign;
					diag2 = diag2 && self.board[expSum - i][i] == sign;
				}
				var result = diag1 || diag2;
//				console.debug("Check diagonals: " + diag1 + ", " + diag2);
				return result;
			},

			isEmpty: function(row, column) {
				return self.board[row+1][column+1] == self.EMPTY;
			},

			getDimension: function() {
				return self.SIZE;
			},
	
			putStone: function(row, column) {
				var sign = self.getNextSign();
				self.board[row + 1][column + 1] = sign;
				if (self.mapping) {
					self.mapping(row, column, sign);
				}
				self.turn++;
			},

			getTurn: function() {
				return self.turn;
			},

			isFull: function() {
				return self.turn == ( self.SIZE * self.SIZE );
			},

			getNextSign: function() {
				return self.signs[self.turn % self.signs.length];
			},

			clone: function() {
				var copy = new TicTacToe.Board();
				for (var i in self) {
					if (typeof(self[i]) != "function") {
//						console.debug("Cloning property " + i);
						copy[i] = clone(self[i]);
					}
				}
				return copy;
			}

		}

		self.init();

		return self;

	},

	RandomPlayer: function() {
		var self = {
			turn: function(board) {
				var dim = board.getDimension();
				do {
					var row = Math.floor(Math.random()  * dim);
					var column = Math.floor(Math.random() * dim);
				} while ( ! board.isEmpty(row, column) );

				board.putStone(row, column);
			},
			init: function(board) {}
		}

		return self;
	},

	AIPlayer: function() {
		var self = {
			strategy: null,

			turn: function(board) {
				var turn = self.getTurn(board);
				board.putStone(turn.row, turn.column);
			},

			getTurn: function(board) {
				var strategy = self.strategy[board.toString() + self.sign];
				var maxScore = -100;
				var maxMove = null;
				for(var k in strategy) {
					if (strategy.hasOwnProperty(k)) {
						if (strategy[k] > maxScore) {
							maxScore = strategy[k];
							maxMove = k;
						}
					}
				}
				var split = maxMove.split(",");
				return { 
					row: parseInt(split[0]),
					column: parseInt(split[1])
				}
			},

			init: function(board, selfSign) {
				self.createStrategy(board, selfSign);
			},

			createStrategy: function(officialBoard, selfSign) {
				var board = officialBoard.clone();
				self.sign = selfSign;
				self.strategy = {};
				var result = self.simulate(board, board.getNextSign());
			},

			simulate: function(board, sign) {
				console.debug("Simulate turn: " + board.turn + " with sign " + sign);
				console.debug(board.toString());
				var code = board.toString() + sign;
				var strategy = self.strategy[code];
				if (strategy) {
					return strategy;
				}

				var result = {};
				var losing = {};
				space_search:
				for (var i = 0; i < board.getDimension(); i++) {
					for (var j = 0; j < board.getDimension(); j++) {
						if (board.isEmpty(i, j)) {
							// lets, simulate turn
							var actBoard = board.clone();
							actBoard.putStone(i, j);
							var score = 0;
							if (actBoard.isOver(sign)) {
								score = 100;
								result = {};
								result[i + "," + j] = score;
								break space_search;
							} else if (actBoard.isFull()) {
								score = 0; 
							} else {
								var flipSign = actBoard.getNextSign();
								var res = self.simulate(actBoard, flipSign);
								var losing = false;
								var count = 0;
								for(var k in res) {
									if (res.hasOwnProperty(k)) {
										score += -1 * res[k];
										if (score == -100) {
											losing = true;
										}
										count++;
									}
								}
								score /= count;
								// it's better finish the game than block
								score -= 1;
							}
							result[i + "," + j] = score;
						}
					}
				}
				self.strategy[code] = result;
				return result;
			}
		}

		return self;
	}


}



function clone(obj) {
	var target = {};
	if (typeof(obj) != "object") {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.clone();
	}
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (typeof(obj[i]) == "object") {
				target[i] = clone(obj[i]);
			} else {
				target[i] = obj[i];
			}
		}
   	}
   	return target;
}

Array.prototype.clone = function() {
    var arr = [];
    for( var i = 0; i < this.length; i++ ) {
        arr[i] = clone(this[i]);
    }
    return arr;
}
