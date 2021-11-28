//WORK IN PROGRESS
var canvas, ctx, height, width;

class random_bot{
    predict( state ){
	var L = state.get_moves().length;
	var move_probs = [];
	for(var k = 0; k < L; k++){
	    move_probs.push( 1/L );
	}

	var s = state.clone();
	while( !s.terminal ){
	    var m = s.get_moves();
	    var r = Math.floor( Math.random()*m.length );
	    s = s.advance( m[r], false );
	}

	var value = evaluate(s);

	return [value, move_probs];
    }
}

var hist = [];
var sim;
var rbot = new random_bot();
var log_opt = {
    'box_size': 70,
    'margin': 0,
}

function hex_helper(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgb_to_hex(r, g, b) {
    return "#" + hex_helper(Math.floor(r)) + hex_helper(Math.floor(g)) + hex_helper(Math.floor(b));
}
function compute_corner(x,y){ //compute canvas coordinates of top-left corner of grid cell (x,y)
    var center = compute_center(x,y);
    var size = log_opt['box_size'];
    var margin = log_opt['margin'];
    return [
	Math.floor( center[0] - size/2 + margin ) - 0.5,
	Math.floor( center[1] - size/2 + margin ) - 0.5
    ]
}
function compute_center(x,y){ //compute canvas coordinates of center of grid cell (x,y)
    var size = log_opt['box_size'];
    return [
	Math.floor( width/2 + (x - DIMX/2 + 0.5)*size ),
	Math.floor( height/2 + (y - DIMY/2 + 0.5)*size )
    ]
}
function grid_log( color_matrix ){
    ctx.fillStyle = '#ffffff'
    ctx.fillRect( 0,0, width, height );
    ctx.fillStyle = '#0000bb'
    for(var y = 0; y < DIMY; y++){
	for(var x = 0; x < DIMX; x++){
	    ctx.fillStyle = color_matrix[y][x];
	    var corner = compute_corner(x,y);
	    var size = log_opt['box_size'];
	    var margin = log_opt['margin'];
	    ctx.fillRect( corner[0] , corner[1], size - 2*margin , size - 2*margin );
	    ctx.strokeRect( corner[0] , corner[1] , size - 2*margin , size - 2*margin );
	}
    }
}


function undo(){
    var L = hist.length;
    if(L > 1){
	hist.pop();
	sim = hist[L-2];
	sim.log();
    }

}
function begin(){ //initialize
    canvas = document.getElementById( 'canvas1' );
    ctx = canvas.getContext('2d');
    height = canvas.height;
    width = canvas.width;

    reset();
    document.addEventListener('keydown', key_press);
}
function reset(){
    sim = new Snake();
    sim.init();
    place_apple( rbot );
    hist = [sim];
    sim.log();
}

function place_apple( bot ){
    if( !sim.terminal ){
	var tree = new Tree(sim);
	mcts( bot, bot, 1500, tree );
	var Ns = [];
	var m = sim.get_moves();
	var L = m.length;
	for(var x = 0; x < L; x++){
	    Ns.push( tree.children[x].N );
	}
	var M = Math.max(...Ns);
	var k = Ns.indexOf(M);
	sim = sim.advance(m[k], false);
    }
}
function move(m){
    if(!sim.terminal){
	sim = sim.advance(m,true);
	if( sim.turn == 1 ){
	    place_apple( rbot );
	}
	hist.push(sim);
	sim.log();
    }
}
function key_press( e ){
    if( e.code == 'ArrowUp' ){ move( [0,-1] ); }
    else if(e.code == 'ArrowRight'){ move( [1,0] ); }
    else if(e.code == 'ArrowLeft'){ move( [-1,0] ); }
    else if(e.code == 'ArrowDown'){ move( [0,1] ); }
    else if(e.code == 'KeyZ'){ undo(); }
    else if(e.code == 'KeyR'){ reset(); }
}
/*function change_grid(x,y){
    DIMX = x;
    DIMY = y;
    log_opt['box_size'] = Math.ceil(420/Math.max(x,y));
    reset();
}*/

const DIRS = [[0,1],[1,0],[-1,0],[0,-1]];
const DIMX = 6;
const DIMY = 6;

class Snake{
    init(){
	this.grid = [
	    [1,0,0,0,0,0],
	    [1,0,0,0,0,0],
	    [1,0,0,0,0,0],
	    [0,0,0,0,0,0],
	    [0,0,0,0,0,0],
	    [0,0,0,0,0,0]
	];
	this.turn = 1;
	this.move_count = 0;
	this.snake = [[0,0],[0,1],[0,2]];
	this.terminal = false;
	this.possible_moves = -1;
	this.apple_timer = 0;
    }
    occupants( x,y ){
	if( x >= DIMX || x < 0 ){
	    return -1;
	} else if( y>= DIMY || y < 0 ){
	    return -1;
	} else {
	    return this.grid[y][x];
	}
    }
    get_moves(){
	if( this.possible_moves == -1 ){
	    var moves;
	    if( this.turn == 0 ){
		moves = this.get_moves_snake();
	    } else if( this.turn == 1 ){
		moves = this.get_moves_apple();
	    }
	    this.possible_moves = moves;
	}
	return this.possible_moves;
    }
    get_moves_apple(){ //returns valid grid spots
	var list = [];
	for(var x = 0; x < DIMX; x++){
	    for(var y = 0; y < DIMY; y++){
		if( this.grid[y][x] == 0 ){
		    list.push( [x,y] );
		}
	    }
	}
	return list;
    }
    get_moves_snake(){ //returns valid directions
	var L = this.snake.length;
	var head = this.snake[L-1];
	var tail = this.snake[0];

	var candidates = [];
	for(var d = 0; d < 4; d++){
	    var dir = DIRS[d];
	    var nx = head[0] + dir[0];
	    var ny = head[1] + dir[1];
	    var occ = this.occupants( nx, ny );
	    if( occ == 0 || occ == 2 ){
		candidates.push( dir );
	    } else if( occ == 1 ){
		if( nx == tail[0] && ny == tail[1] ){
		    candidates.push( dir );
		}
	    }
	}
	return candidates;
    }
    clone(){ //clones all data except possible_moves
	var n = new Snake()
	n.grid = JSON.parse(JSON.stringify(this.grid));
	n.turn = this.turn;
	n.move_count = this.move_count;
	n.snake = JSON.parse(JSON.stringify(this.snake));
	n.terminal = this.terminal;
	n.possible_moves = -1;
	n.apple_timer = this.apple_timer;
	return n;
    }
    advance_apple( s, move ){
	s.grid[ move[1] ][ move[0] ] = 2;
	s.turn = 0;
	return s;
    }
    advance_snake( s, move ){
	var L = this.snake.length;
	var head = this.snake[L-1];
	var tail = this.snake[0];
	s.grid[ tail[1] ][ tail[0] ] = 0;

	var nx = head[0] + move[0];
	var ny = head[1] + move[1];
	var occ = s.occupants( nx,ny );

	s.move_count += 1;
	if( occ == -1 || occ == 1 ){
	    s.terminal = true;
	} else if( occ == 2 ){
	    s.grid[ ny ][ nx ] = 1;
	    s.grid[ tail[1] ][ tail[0] ] = 1;
	    s.snake.push( [nx,ny] );
	    s.turn = 1;
	    s.apple_timer = 0;
	} else if( occ == 0 ){
	    s.grid[ ny ][ nx ] = 1;
	    s.snake.push( [nx,ny] );
	    s.snake.shift();
	    s.apple_timer += 1;
	}
	return s;
    }
    advance( move, clone=true ){
	var next_state;
	if( clone ){ 
	    next_state = this.clone(); 
	} else { 
	    next_state = this; 
	}
	next_state.possible_moves = -1;
	if( this.turn == 0 ){
	    next_state = this.advance_snake( next_state, move );
	} else if( this.turn == 1 ){
	    next_state =  this.advance_apple( next_state, move );
	}
	if( next_state.get_moves().length == 0 ){
	    next_state.terminal = true;
	}
	return next_state;
    }
    log(){
	var color_matrix = [];
	for(var y = 0; y < DIMY; y++){
	    var row = [];
	    for(var x = 0; x < DIMX; x++){
		var o = this.grid[y][x];
		if( o == 2 ){ row.push(rgb_to_hex(255,0,0)) }
		else if (o == -1){ row.push(rgb_to_hex(0,0,0)) }
		else{ row.push(rgb_to_hex(255,255,255)) }
	    }
	    color_matrix.push(row);
	}
	var L = this.snake.length;
	for(var k = 0; k < L; k++){
	    var spot = this.snake[k];
	    var c = 127+64*(k/(L-1));
	    var s;
	    if(this.terminal){
		if(this.snake.length == DIMX*DIMY){
		    s = rgb_to_hex(0,c,0);
		} else {
		    s = rgb_to_hex(255-c,255-c,255-c);
		}
	    } else {
		s = rgb_to_hex(c,c,0)
	    }
	    color_matrix[spot[1]][spot[0]] = s;
	}
	grid_log(color_matrix);
	ctx.fillStyle = '#202020'
	ctx.font = '30px Arial';
	ctx.textAlign = 'center';
	ctx.fillText( this.move_count, width/2, 40);
    }
}

function evaluate( t ){
    return t.snake.length - t.move_count/30;
}

class Tree{
    constructor( state ){
	this.children = [];
	this.state = state;
	this.terminal = state.terminal;
	this.N = 0; this.P = 0; this.Q = 0;
    }
    expand( move_probs ){
	var state = this.state;
	var moves = state.get_moves();
	var L = moves.length;
	for(var a = 0; a < L; a++){
	    var new_state = state.advance( moves[a], true );
	    var m = new_state.get_moves()
	    if( m.length == 1 ){
		new_state = new_state.advance( m[0], false );
	    }
	    var new_tree = new Tree( new_state );
	    new_tree.P = move_probs[a];
	    this.children.push( new_tree );
	}
    }
}

function backpropagate( path, value ){
    var L = path.length;
    const RETAIN = 1;
    for(var a = 0; a < L; a++){
	var node = path[a];
	var N = node.N;
	node.Q = (RETAIN * node.Q*(N-1) + value) / (1 + RETAIN*(N-1))
    }
}
function mcts_find( path, head ){
    head.N += 1;
    path.push(head);
    if( head.children.length == 0 ){
	return path;
    } else {
	return mcts_find( path, select_child(head) );
    }
}
function select_child( head ){
    var t = head.state.turn;
    var N = head.N;
    var L = head.children.length;
    var UCBS = [];
    for(var a = 0; a < L; a++){
	var child = head.children[a];
	UCBS.push( child.Q * (1 - 2*t) + L * child.P * Math.sqrt(N / (0.001 + child.N) ) )
    }
    var M = Math.max(...UCBS);
    var k = UCBS.indexOf( M );
    return head.children[k];
}
function mcts( player_snake, player_apple, sims, root ){
    for(var g = 0; g < sims; g++){
	var path = mcts_find( [], root );
	var L = path.length;
	var leaf = path[L-1];

	if( leaf.terminal ){
	    var s = leaf.state;
	    backpropagate( path, evaluate(s) );
	}

	var turn = leaf.state.turn;
	var pred;
	if( turn == 0 ){
	    pred = player_snake.predict( leaf.state ); 
	} else if( turn == 1 ){
	    pred = player_apple.predict( leaf.state );
	}
	var m = pred[1];
	var v = pred[0];
	leaf.expand(m);
	backpropagate( path, v );
    }
}

begin();
