//USAMO 2003/6
var canvas, ctx, height, width;
var mousex = -1; var mousey = -1;
var size = 147; //arbitrary paramater that controls something
var radius = size/4;
var cycle = [24,23,5,43,11,13]; //sum odd
var cyc_list = []; //history
var vs = []; //vertex coordinates
var status = 'N';
var loss_animation = 0;

function begin(){ //initialize
    canvas = document.getElementById( 'canvas1' );
    ctx = canvas.getContext('2d');
    height = canvas.height;
    width = canvas.width;
    for(var j = 0; j < 6; j++){
        vs.push( [ 
            Math.floor( width/2 + size * Math.cos( Math.PI * j/3 ) ),
            Math.floor( height/2 + size * Math.sin( Math.PI * j/3 ) )
        ])
    }
    log();

    canvas.addEventListener('mousemove', function(e){
        var rect = canvas.getBoundingClientRect();
        mousex = e.clientX - rect.left;
        mousey = e.clientY - rect.top;
        log();
    })
    canvas.addEventListener('mouseout', function(e){
        mousex = -1; mousey = -1;
    })
    canvas.addEventListener('click', function(e){
        for(var j = 0; j < 6; j++){
            var dx = mousex - vs[j][0];
            var dy = mousey - vs[j][1];
            if( dx*dx + dy*dy <= radius*radius ){
                operate(j);
                log();
                break;
            }
        }
    })
}
function operate(x){ //replace the number on vertex x with the difference of its neighbors
    var old = JSON.parse(JSON.stringify(cycle));
    cycle[x] = Math.abs(cycle[(x+1) % 6] - cycle[(x+5) % 6]);
    var sum = cycle.reduce((a, b) => a + b, 0)
    if(sum == 0){ status = 'W'; }

    for(var t = 0; t < 3; t++){
        var pass = true;
        var ratio = -1;
        for(var j = 0; j < 6; j++){
            var ind = (j - t + 6) % 6;
            if( (j - t + 3) % 3 == 2 ){
                if( cycle[j] !== 0 ){
                    pass = false; break;
                }
            } else if (ratio == -1){
                ratio = cycle[j]
            } else {
                if( cycle[j] !== ratio ){
                    pass = false; break;
                }
            }
        }
        if( pass ){
            status = 'L' + t.toString();
            var loss_interval = setInterval(function(){ 
                loss_animation += 0.03;
                if( loss_animation > 0.99){
                    loss_animation = 1;
                    clearInterval( loss_interval );
                }
                log();
            }, 100);
        }
    }

    if( cycle[x] !== old[x] ){
        cyc_list.push( old );
    }
}
function undo(){
    if( status !== 'W' ){
        cycle = cyc_list.pop();
        log();
    }

}
function draw_line( v1, v2 ){ //draws a line between two vertices of the hexagon
    ctx.beginPath();
    ctx.moveTo( vs[ v1%6 ][0] + 0.5 , vs[ v1%6 ][1] + 0.5 )
    ctx.lineTo( vs[ v2%6 ][0] + 0.5 , vs[ v2%6 ][1] + 0.5 )
    ctx.stroke();
    ctx.closePath();
}
function log(){ //draw on canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect( 0,0, width, height );
    ctx.textAlign = "center";

    ctx.fillStyle = '#222222'
    ctx.font = '15px Arial';
    ctx.fillText("Each click replaces a number with the difference of its neighbors.", width/2, 50);
    ctx.fillText("Is it possible to obtain a 0 at every vertex?", width/2, 75);

    if( status[0] == 'L' ){ //death position 'X'
        var type = parseInt(status[1]);
        ctx.globalAlpha = loss_animation;
        ctx.strokeStyle = '#ff3300';
        draw_line( type, type+3 );
        draw_line( type+1, type+4 );
        ctx.globalAlpha = 1 - loss_animation;
    }
    for(var j = 0; j < 6; j++){
        if( cycle[j] == 0 || cycle[(j+1)%6] == 0){ ctx.strokeStyle = '#35e022' } 
        else { ctx.strokeStyle = '#000000' }
        draw_line(j, j+1)
    }

    ctx.globalAlpha = 1
    if(status == 'W'){ ctx.strokeStyle = '#35e022'; }
    else{ ctx.strokeStyle = '#888888' }
    for(var j = 0; j < 6; j++){
        draw_line(j,j+2);
    }

    if(status == 'W'){ ctx.strokeStyle = '#35e022'; }
    else{ ctx.strokeStyle = '#000000' }
    for(var j = 0; j < 6; j++){ //vertices
        ctx.beginPath();
        ctx.arc( vs[j][0] , vs[j][1] , radius, 0, 2 * Math.PI, false);
        ctx.stroke();
        var dx = mousex - vs[j][0];
        var dy = mousey - vs[j][1];
        if( dx*dx + dy*dy <= radius*radius ){
            ctx.fillStyle = '#f3f3f3'
        } else {
            ctx.fillStyle = '#ffffff'
        }
        ctx.fill();
        ctx.closePath();
    }

    ctx.fillStyle = '#222222';
    ctx.font = "30px Courier New";
    for(var j = 0; j < 6; j++){ //numbers
        ctx.fillText( cycle[j].toString() , vs[j][0], vs[j][1]+9 );
    }
}
begin();
