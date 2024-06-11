class Snake{
	static N = 6;
	static DIRS = [1,Snake.N+1,-1,-Snake.N-1];
	
	constructor(snake=[36,35,28], apple=36){
		this.snake = snake; //head in front
		this.apple = apple;
	}
	static in_bounds(p){
		return (p % (Snake.N+1) < Snake.N) && p >= 0 && p < (Snake.N)*(Snake.N+1)-1;
	}
	get_moves(){
		var moves = [];
		
		if( this.snake[0] == this.apple ){
			var body = new Array( (Snake.N)*(Snake.N+1) ).fill(0);
			for( var x = this.snake.length-1; x >= 0; x-- ){
				body[ this.snake[x] ] = 1;
			}
			for( var y = (Snake.N*Snake.N)-1; y >= 0; y -= (Snake.N+1) ){
				for( var x = y+(Snake.N-1); x >= y; x-- ){
					if( body[x] == 0 ){
						moves.push(x);
					}
				}
			}
		} else {
			for( var c = 0; c < 4; c++ ){
				var DIR = Snake.DIRS[c];
				var nhead = DIR + this.snake[0];
				if( Snake.in_bounds(nhead) && (!this.snake.includes(nhead) || nhead == this.snake[this.snake.length-1]) ){
					moves.push(DIR);
				}
			}
		}
		return moves;
	}
	advance(move){
		if( this.snake[0] == this.apple ){
			return new Snake([...this.snake],move);
		} else {
			var nhead = move + this.snake[0];
			if( nhead == this.apple ){
				return new Snake([nhead,...this.snake],this.apple);
			} else {
				return new Snake([nhead,...this.snake.slice(0,-1)],this.apple);
			}
		}
	}

	hash(){
		var coords = [ this.apple % (Snake.N+1), (this.apple / (Snake.N+1))>>0 ];
		for( var i = 0; i < this.snake.length; i++ ){
			let num = this.snake[i];
			coords.push( num % (Snake.N+1) );
            coords.push( (num / (Snake.N+1)) >> 0 );
		}
		
		let L = coords.length;
		var invert_X = [...coords];
		for( var i = 0; i < L; i += 2 ){
			invert_X[i] = Snake.N-1-coords[i];
		}
		if( invert_X < coords ){
			coords = invert_X;
		}
		
		var invert_Y = [...coords];
		for( var i = 1; i < L; i += 2 ){
			invert_Y[i] = Snake.N-1-coords[i];
		}
		if( invert_Y < coords ){
			coords = invert_Y;
		}
		
		var switch_XY = [];
		for( var i = 0; i < L; i += 2 ){
			switch_XY.push( coords[i+1] );
			switch_XY.push( coords[i] );
		}
		if( switch_XY < coords ){
			coords = switch_XY;
		}
		
		var h = [0,0];
		for( var i = 0; i < L; i += 1 ){
			let hashes = SNAKE_HASHES[ Snake.N*i + coords[i] ];
			h[0] ^= hashes[0];
			h[1] ^= hashes[1];
		}
		h[0] >>>= 0;
		h[1] >>>= 0;
		if( h[1] >= Math.pow(2,31) ){
			let m = h[1]>>>29;
			h[0] += m;
			h[1] ^= m << 29;
			if( h[0] >= Math.pow(2,32) ){
				h[1] += 1;
				h[0] -= Math.pow(2,32);
			}
		}
		return h;
	}
}
