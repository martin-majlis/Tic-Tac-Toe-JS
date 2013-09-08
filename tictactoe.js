var TicTacToe = {
	Game: function() {
		var self = {			
			players: [],
			playersCount: 0,
			board: null,
			actSign: null,

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
				board.game = self;
			},
			
			start: function() {
				self.actSign = self.board.getNextSign();
 				self.nextTurn();
			},

			nextTurn: function() {
				if (self.board.isOver(self.actSign) || self.board.isFull() ) {
					var msg = "Draw";
					if ( ! self.board.isFull() ) {
						var player = self.players[self.actSign];
						msg = player.name + " win!!!";
					}
					self.report(msg);
				} else {
					self.actSign = self.board.getNextSign();
					var player = self.players[self.actSign];
					self.report(player.name + " turn");
					player.turn(self.board);
				}

			},

			restart: function() {
				self.board.restart();
				self.start();
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
				self.turn = 0;
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
					if (i == "game") {
						continue;
					}
					if (typeof(self[i]) != "function") {
//						console.debug("Cloning property " + i);
						copy[i] = clone(self[i]);
					}
				}
				return copy;
			},

			restart: function() {
				self.init();
				for (var i = 0; i < self.SIZE; i++) {
					for (var j = 0; j < self.SIZE; j++) {
						if (self.mapping) {
							self.mapping(i, j, "&nbsp;");
						}
					}
				}
			},
	
			nextTurn: function(){
				self.game.nextTurn();
			}

		}

		self.init();

		return self;

	},

	RandomPlayer: function() {
		var self = {
			name: "Random",
			turn: function(board) {
				var dim = board.getDimension();
				do {
					var row = Math.floor(Math.random()  * dim);
					var column = Math.floor(Math.random() * dim);
				} while ( ! board.isEmpty(row, column) );

				board.putStone(row, column);
				board.nextTurn();
			},
			init: function(board) {}
		}

		return self;
	},

	HumanPlayer: function() {
		var self = {
			name: "Human",
			strategy: null,
			board: null,
			waiting: true,
			row: null,
			column: null,

			turn: function(board) {
				self.board = board;
				if (self.waiting) {
					setTimeout(function() {
						self.turn(board);
					}, 200);
				} else {
					self.waiting = true;
					board.putStone(self.row, self.column);
					board.nextTurn();
				}
			},
			doTurn: function(row, column) {
				if (self.board.isEmpty(row, column)) {
					self.row = row;
					self.column = column;
					self.waiting = false;
				}
			},

			init: function(board) {
				self.board = board;
			},
			setFieldPrefix: function(prefix) {
				for (var i = 0; i < self.board.getDimension(); i++) {
	 				for (var j = 0; j < self.board.getDimension(); j++) {
						var el = document.getElementById(prefix + i + j);
						var obj = { i: i, j: j };
						var f = function(obj) {
							console.log("Click on " + obj.i + ", " + obj.j);
						};
						el.onclick = function(evt) {
							var id = evt.target.id;
							var match = id.match(/(\d)(\d)/);
							var i = parseInt(match[1]);
							var j = parseInt(match[2]);
							self.doTurn(i, j);						
						}
					}
				}
			}
		}

		return self;
	},

	AIPlayer: function() {
		var self = {
			strategy: null,
			name: "AI",

			turn: function(board) {
				var turn = self.getTurn(board);
				board.putStone(turn.row, turn.column);
				board.nextTurn();
			},

			getTurn: function(board) {
				var strategy = self.strategy[board.toString() + self.sign];
				var maxScore = -1000;
				var options = [];

				for(var k in strategy) {
					if (strategy.hasOwnProperty(k)) {
						if (strategy[k] > maxScore) {
							maxScore = strategy[k];
							options = [k];
						} else if (strategy[k] == maxScore) {
							options.push(k);
						}
					}
				}
				var maxMove = options[Math.floor(options.length * Math.random())];
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
				var beginTime = new Date().getTime();
				var result = self.simulate(board, board.getNextSign());
				var endTime = new Date().getTime();

				console.info("Simulation time: " + (endTime - beginTime));
			},

			simulate: function(board, sign) {
				//console.debug("Simulate turn: " + board.turn + " with sign " + sign);
				var code = board.toString() + sign;
				var strategy = self.strategy[code];
				if (strategy) {
					return strategy;
				}

				var result = {};
				var toSolve = [];
				var isWinning = false;
				space_search:
				for (var i = 0; i < board.getDimension(); i++) {
					for (var j = 0; j < board.getDimension(); j++) {
						if (board.isEmpty(i, j)) {
							var actBoard = board.clone();
							actBoard.putStone(i, j);
							if (actBoard.isOver(sign)) {								
								result[i + "," + j] = 100;
								isWinning = true;
								break space_search;
							} else {
								toSolve.push({i:i, j:j, board: actBoard});
							}
						}
					}
				}
				if ( ! isWinning ) {
					for (var l = 0; l < toSolve.length; l++) {
						var pos = toSolve[l];
						var actBoard = pos.board;
						var i = pos.i;
						var j = pos.j;				
						var score = 0;
						if (actBoard.isFull()) {
							score = 0; 	
						} else {
							var flipSign = actBoard.getNextSign();
							var res = self.simulate(actBoard, flipSign);
							var count = 0;
							for(var k in res) {
								if (res.hasOwnProperty(k)) {
									score += -1 * res[k];
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
