/*
 *      sodiestar.js
 *      
 *      Copyright 2011 Franco Bianconi <fbianconi@gmail.com>
 *      
 *      This program is free software; you can redistribute it and/or modify
 *      it under the terms of the GNU General Public License as published by
 *      the Free Software Foundation; either version 2 of the License, or
 *      (at your option) any later version.
 *      
 *      This program is distributed in the hope that it will be useful,
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of
 *      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *      GNU General Public License for more details.
 *      
 *      You should have received a copy of the GNU General Public License
 *      along with this program; if not, write to the Free Software
 *      Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 *      MA 02110-1301, USA.
 *      
 *      
 */

/*TODO:
 ****** CLEAN UP!!! ******
 * add asteroids in a game-startable way (use some auto shield for start) - KINDA DONE
 * check collisions (ship-asteroid#; ship-bullet?:teleport; bullet-asteroid#) - KINDA DONE
 * HUD score/time/bullets/acuracy, etc - KINDA DONE
 * powerups (shield/life/teleports) - KINDA DONE
 * death/death animation - KINDA DONE
 * lives/restart - KINDA DONE
 * pause game - KINDA DONE
 * make borders of the screen roll (change bullets behaviour acordingly) - KINDA DONE
 * make angle of turn a variable? (change teleport and autobrake acordingly) - NO
 * fix teleports - KINDA DONE
 * make shield - KINDA DONE
 * make objects rolling appear on both sides while rolling - MAYBE NOT
 * Touch support - WiP
 * support css - WIP
 */

// game constructor(){
const svgns="http://www.w3.org/2000/svg";

var width=853;
var height=400;

//TODO: recompute size 

(function (obj, evType, fn){
	if (obj.addEventListener){ 
		obj.addEventListener(evType, fn, false); 
		return true; 
	} else if (obj.attachEvent){ 
		var r = obj.attachEvent("on"+evType, fn); 
		return r; 
	} else { 
		return false; 
	} 
})(window, 'load', function(){
    
    var game=new Game();
    window.game=game

    var keyspressed="";
    
    // width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    // height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    game.board.setAttribute("class", "board")
    game.board.setAttribute("style","width: auto; height: 100vh;");
	 document.body.appendChild(game.board);
    game.ship = document.createElementNS(svgns,"g");
    
    //TODO: save svg resources to another file? - NOT LIKELY
    game.ship.chasis=document.createElementNS(svgns,"path");
    game.ship.chasis.setAttribute("d","m 15,0 -17,-10 2,-3 -15,-2 6,8 -3,7 3,7 -6,8 15,-2 -2,-3 z");
    game.ship.chasis.setAttribute("class","chasis");
    game.ship.cockpit=document.createElementNS(svgns,"path");
    game.ship.cockpit.setAttribute("d","m 8,0 -10,-5 0,10 z");
    game.ship.cockpit.setAttribute("class","cockpit");
    game.ship.shield=document.createElementNS(svgns,"circle");
    game.ship.shield.setAttribute("r",40);
    game.ship.shield.setAttribute("class", "shield");
    
    game.ship.appendChild(game.ship.chasis);
    game.ship.appendChild(game.ship.cockpit);
    game.ship.appendChild(game.ship.shield);

    // window.ship=game.ship
    
	 game.board.appendChild(game.ship);
    game.board.appendChild(game.hud);
    
    game.hud.lifes=new Array();
    game.hud.teleports=new Array();
    
    game.hud.shieldPlace=document.createElementNS(svgns,"rect");
    game.hud.shieldPlace.setAttribute("class","shieldPlace");
    game.hud.shieldPlace.setAttribute("x",width/2-50);
    game.hud.shieldPlace.setAttribute("y",height-40);
    game.hud.shieldPlace.setAttribute("width",100);
    game.hud.shieldPlace.setAttribute("height",30);
    game.hud.shieldAmount=document.createElementNS(svgns,"rect");
    game.hud.shieldAmount.setAttribute("class","shieldAmount");
    game.hud.shieldAmount.setAttribute("x",width/2-48);
    game.hud.shieldAmount.setAttribute("y",height-38);
    game.hud.shieldAmount.setAttribute("width",0);//min=0; max=96;
    game.hud.shieldAmount.setAttribute("height",26);
    game.hud.appendChild(game.hud.shieldPlace);
    game.hud.appendChild(game.hud.shieldAmount);
    
    game.ship.shield.Max=100; //frames
    game.ship.accel=0.25; 
    game.ship.teleportsDelay=3; 
    game.ship.isVisible=true;
    game.ship.radius=8;
    game.ship.firedelay=3; //in frames delay between 2 shots
    
    // var txt = document.createElement("div");
    // document.body.appendChild(txt);
    
    game.ship.fire=function(){
        if (game.ship.fireleft<=0 && game.ship.isVisible){
            let bullet=document.createElementNS(svgns,"path");
            bullet.radius=3;
            var x = 2*bullet.radius*Math.cos((game.ship.angle)* (Math.PI/180));
            var y = 2*bullet.radius*Math.sin((game.ship.angle)* (Math.PI/180));
            bullet.setAttribute("d","m 0,0 "+x+","+y);
            bullet.setAttribute("class","bullet");
            bullet.ctx=game.ship.ctx;
            bullet.cty=game.ship.cty;
            bullet.setAttribute("transform","translate("+bullet.ctx+","+bullet.cty+")");
            bullet.angle=game.ship.angle;
            bullet.speed=19;
            bullet.life=Math.min(width,height)*.95/20;
            bullet.move=function(){
                this.ctx+=this.speed*Math.cos((this.angle)* (Math.PI/180));
                this.cty+=this.speed*Math.sin((this.angle)* (Math.PI/180));
                this.setAttribute("transform","translate("+this.ctx+","+this.cty+")");
                if (this.ctx<0)this.ctx+=width;
                if (this.cty<0)this.cty+=height;
                if (this.ctx>width)this.ctx-=width;
                if (this.cty>height)this.cty-=height;
                for (x in game.asteroids){ // bullet-asteroid hit check
                    var distance=Math.sqrt(Math.pow((this.ctx-game.asteroids[x].ctx),2)+Math.pow((this.cty-game.asteroids[x].cty),2));
                    if (distance<game.asteroids[x].radius){
                        try{
                            game.board.removeChild(this);
                        }catch(e){
                            var z=null;
                        } //already removed
                        game.bullets.splice(game.bullets.indexOf(this),1);
                        game.asteroids[x].hit();
                        game.bulletsHit++;
                        return;
                    }
                }
                this.life--;
                if (this.life<=0){ //bullet decay
                    try{
                        game.board.removeChild(this);
                    }catch(e){
                        var z=null;
                    } //already removed
                    game.bullets.splice(game.bullets.indexOf(this),1);
                }
            }
            game.board.insertBefore(bullet,game.ship);
            game.bullets.push(bullet);
            game.ship.fireleft=game.ship.firedelay;
            game.bulletsFired++;
        }
    }

    game.hud.updateShield=function(){
        if (game.ship.shield.left>game.ship.shield.Max)game.ship.shield.left=game.ship.shield.Max;
        game.hud.shieldAmount.setAttribute("width",game.ship.shield.left/game.ship.shield.Max*96);//min=0; max=96;
    }
    
    game.hud.alert=function(message, time){
        try{
            game.hud.removeChild(game.hud.msg);
        }catch(e){}
        if (message){
            game.hud.msg=document.createElementNS(svgns,"g");
            game.hud.msg.rect=document.createElementNS(svgns,"rect");
            game.hud.msg.rect.setAttribute("style","fill:#000;fill-opacity:.7");
            
            game.hud.msg.text=document.createElementNS(svgns,"text");
            game.hud.msg.text.setAttribute("style","stroke:#none;fill:#fff");
            game.hud.msg.appendChild(game.hud.msg.rect);
            game.hud.msg.appendChild(game.hud.msg.text);
            game.hud.appendChild(game.hud.msg);
            var mySplit = message.split("\n");
            if (mySplit.length==1){
                game.hud.msg.text.textContent=message;
            }else{
                for (let i in mySplit){
                    let tspan=document.createElementNS(svgns,"tspan");
                    tspan.textContent=mySplit[i];
                    game.hud.msg.text.appendChild(tspan);
                    //in 2019 offsetWidth is 0 until render
                    //TODO: make dynamic
                    // let ww=tspan.offsetWidth; 
                    // let hh=tspan.offsetHeight;
                    var ww=365;
                    var hh=18;
                    tspan.setAttribute("y",hh*i-hh*mySplit.length/2+14);
                    tspan.setAttribute("x",ww/-2);
                }
            }
            // var w = hud.msg.text.offsetWidth;
            // var h = hud.msg.text.offsetHeight;
            var w=380;
            var h=160;

            game.hud.msg.rect.setAttribute("x",w/-2-10);//and this
            game.hud.msg.rect.setAttribute("y",h/-2-5);
            game.hud.msg.rect.setAttribute("width",w+20);
            game.hud.msg.rect.setAttribute("height",h+10);
            game.hud.msg.text.setAttribute("x",w/-2);
            game.hud.msg.text.setAttribute("y",h/2-5);
            
            game.hud.msg.setAttribute("transform","translate("+width/2+","+height/2+")");
            if (typeof time === 'number'){
                window.setTimeout(()=> game.hud.alert(''), time);
            }
        }
    }

    game.ship.shield.enable=function(val){
        game.ship.shield.enabled=val;
        game.ship.radius=(val?40:8);
        game.ship.shield.setAttribute("style","position:relative;fill:#048;fill-opacity:"+(val?.3:0)+";stroke:#048;stroke-width:1px;stroke-opacity:"+(val?1:0));
        game.hud.updateShield();
    }
    
    var timer=null;
    //todo: make real loop? - NOT LIKELY
    var tf=function(){//main "loop" every 40ms (25fps)
        if (!game.paused){
            //general delays
            game.ship.fireleft--;
            game.ship.teleportsframesleft--;
            if (game.wait >=0 )game.wait --;
            
            if (keyspressed.indexOf(":90")!= -1 ){ //z (auto brakes)
                keyspressed=keyspressed.replace(":37x", "");//auto-left
                keyspressed=keyspressed.replace(":38x", "");//auto-up
                keyspressed=keyspressed.replace(":39x", "");//auto-right
                if (Math.abs(game.ship.sx)<game.ship.accel && Math.abs(game.ship.sy)<game.ship.accel){
                    game.ship.sx=0;
                    game.ship.sy=0;
                    //otherwise it'll never stop, yes I cheated
                }else{
                    var advAngle=(Math.atan2(game.ship.sy,game.ship.sx)*(180/Math.PI));
                    if (advAngle<0)advAngle+=360;
                    var diff = advAngle-game.ship.angle;
                    if (diff<0)diff+=360;
                    if (diff>165&&diff<195){
                        keyspressed+=":38x";//auto-up
                    }else if (diff<=165){
                        keyspressed+=":37x";//auto-left
                    }else if (diff>=195){
                        keyspressed+=":39x";//auto-right
                    }
                }
            }else{ //its a pulsator
                keyspressed=keyspressed.replace(":37x", "");//left
                keyspressed=keyspressed.replace(":38x", "");//up
                keyspressed=keyspressed.replace(":39x", "");//right
                keyspressed=keyspressed.replace("x", "");//auto-cleanup-if-you-pressed-and-released-some-keys-when-trying-to-auto-break
            }
            if (keyspressed.indexOf(":37")!= -1 ){ //left
                game.ship.angle-=15;
                if (game.ship.angle<0) game.ship.angle=360-15;
            }
            if (keyspressed.indexOf(":39")!= -1 ){ //right
                game.ship.angle+=15;
                if (game.ship.angle==360) game.ship.angle=0;
            }
            if (keyspressed.indexOf(":38")!= -1 ){ //up
                game.ship.sx+=game.ship.accel*Math.cos((game.ship.angle)* (Math.PI/180));
                game.ship.sy+=game.ship.accel*Math.sin((game.ship.angle)* (Math.PI/180));
            }
            if (keyspressed.indexOf(":17")!= -1 ){ //ctrl (shot)
                game.ship.fire();
            }
            if (game.ship.shield.auto>=0){ //auto shield
                game.ship.shield.auto--; 
                game.ship.shield.enable(true);
            }else{
                if (keyspressed.indexOf(":16")!= -1 && game.ship.shield.left>0 && game.ship.isVisible){ //shift (shield)
                    game.ship.shield.left--;
                    game.ship.shield.enable(true);
                }else{ //its a pulsator
                    game.ship.shield.enable(false);
                }
            }
            if (keyspressed.indexOf(":88")!= -1 && game.ship.teleportsLeft>0 && game.ship.teleportsframesleft<0 ){ // (teleport)
                game.useTeleport();
            }
            if (keyspressed.indexOf(":80")!= -1 ){ //p (pause)
                keyspressed=keyspressed.replace(":80", "");
                game.hud.alert("Pausa, presiona 'p' para continuar");
                game.paused=true;
            }
            
            //ship.move(){
            game.ship.ctx+=game.ship.sx;
            game.ship.cty+=game.ship.sy;
            if(game.ship.ctx>width)game.ship.ctx-=width;
            if(game.ship.cty>height)game.ship.cty-=height;
            if(game.ship.ctx<0)game.ship.ctx+=width;
            if(game.ship.cty<0)game.ship.cty+=height;
            game.ship.setAttribute("transform","translate("+game.ship.ctx+","+game.ship.cty+") rotate("+game.ship.angle+")");
            //}      
            for (let x in game.asteroids){
                game.asteroids[x].move();
            }
            for (let i in game.bullets){
                game.bullets[i].move();
            }
            for (let i in game.powerups){
                game.powerups[i].move();
            }
        }else{
            if (keyspressed.indexOf(":80")!= -1 ){ //p (pause)
                keyspressed=keyspressed.replace(":80", "");
                game.paused=false;
                game.hud.alert("");
            }
        }
        timer=window.setTimeout(tf, 55);
    }

    window.onkeydown=function(evt){
        if(game.lifes >= 0 ){
            let keynum=evt.which;
            keyspressed=keyspressed.replace(":"+keynum, "");
            keyspressed+=":"+keynum; //simply pull
            //txt.innerHTML=keyspressed
        }else{
            if (game.newGameMsgVisible == true){
                game.hud.alert("")
                game.newGameMsgVisible = false
                game.start()
            }
        }
    }
    
    window.onkeyup=function(evt){
        let keynum=evt.which;
        keyspressed=keyspressed.replace(":"+keynum, "");
    }

    // window.onresize=function(evt){
    //     width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    //     height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    //     game.board.setAttribute("style","width:"+width+"px;height:"+height+"px;");
    // }
    
    game.hud.alert("Flechas Izq, Der, Arr - dirigen la nave\nCtrl - dispara\nShift - escudo\nZ - freno\nMeta - teleport\n\npartida en pausa, presiona 'p' para continuar");
    game.start();
    game.paused=true;
    tf();
});


class Game {
    constructor(){
        this.wait=0;
        this.bullets=new Array();
        this.asteroids=new Array();
        this.powerups=new Array();
        this.powerupProbability=0.05;

        this.board=document.createElementNS(svgns,"svg");
        this.board.setAttribute("viewBox", "0 0 853 400")
        let square = document.createElementNS(svgns,"rect");
        square.setAttribute("style","fill:none; stroke:#000; stroke-width:2;");

        square.setAttribute("x",0);//and this
        square.setAttribute("y",0);
        square.setAttribute("width",1066);
        square.setAttribute("height",600);
        this.board.appendChild(square)
        this.hud=document.createElementNS(svgns,"g");
    }

    addAsteroid(ax, ay, aa, ar){
        let asteroid=document.createElementNS(svgns,"circle");
        asteroid.radius=(ar?ar:40);
        asteroid.ctx=(ax?ax:Math.random()*width);
        asteroid.cty=(ay?ay:Math.random()*height);
        asteroid.angle=(aa?aa:Math.random()*360);
        asteroid.speed=Math.random()*10; //maxspeed=10
        asteroid.setAttribute("r",asteroid.radius);
        asteroid.setAttribute("style","position:relative;fill:#987;stroke:#000000;stroke-width:1px;");
        asteroid.setAttribute("transform","translate("+asteroid.ctx+","+asteroid.cty+")");

        let game=this
        asteroid.move=function(){
            this.ctx+=this.speed*Math.cos((this.angle)* (Math.PI/180));
            this.cty+=this.speed*Math.sin((this.angle)* (Math.PI/180));
            if (this.ctx<0)this.ctx+=width;
            if (this.cty<0)this.cty+=height;
            if (this.ctx>width)this.ctx-=width;
            if (this.cty>height)this.cty-=height;
            this.setAttribute("transform","translate("+this.ctx+","+this.cty+")");
            if (game.ship.isVisible){
                var distance=Math.sqrt(Math.pow((game.ship.ctx-this.ctx),2)+Math.pow((game.ship.cty-this.cty),2));
                if (distance<(this.radius+game.ship.radius)){ //ship crash
                    this.hit();
                    if (game.ship.shield.enabled!=true){
                        game.removeLife();
                    }
                }
            }
        }

        asteroid.hit=function(){
            this.radius*=.6;
            game.powerUp(this.ctx,this.cty,this.angle, this.speed);
            if (this.radius<10){
                try{
                    game.board.removeChild(this);
                }catch(e){
                    var z=null;
                } //already removed
                game.asteroids.splice(game.asteroids.indexOf(this),1);
                if (game.asteroids.length==0){
                    //txt.innerText="Level Cleared - acuracy : "+(this.bulletsHit/this.bulletsFired*100)+"%";
                    setTimeout(()=> game.newLevel() , 2000);
                }
            }else{
                this.setAttribute("r",this.radius);
                var angle=this.angle;
                this.angle=(angle+Math.random()*180)-90;
                game.addAsteroid(this.ctx,this.cty,(angle+Math.random()*180)-90,this.radius);
            }
        }
        game.board.insertBefore(asteroid,this.ship);
        game.asteroids.push(asteroid);
        return asteroid;
    }

    powerUp(ax,ay,angle,speed){
        if (Math.random() < this.powerupProbability){
            var item=Math.random();
            var pup=null;
            //TODO:fix probabilities
            let game=this
            if (item<.2){//life
                pup=this.ship.chasis.cloneNode();
                pup.setAttribute("style","fill:#000;stroke:none;fill-opacity:.3");
                pup.life=100;//frames
                pup.func=()=>this.addLife();
            }else if (item<.6){//shield

                pup=document.createElementNS(svgns,"circle");
                pup.setAttribute("style","fill:#048;fill-opacity:.3;stroke:#048;stroke-width:2px;");
                pup.setAttribute("r","20");
                pup.func=function(){
                    game.ship.shield.left+=40;
                    game.hud.updateShield();
                }
                pup.life=150;//frames
            }else{//teleport
                pup=this.ship.chasis.cloneNode();
                pup.setAttribute("style","fill:none;stroke:#000;stroke-width:2;stroke-opacity:.3");
                pup.life=120;//frames
                pup.func=()=>this.addTeleport();
            }
            pup.ctx=ax;
            pup.cty=ay;
            pup.angle=angle;
            pup.speed=speed;
            pup.radius=20;
            pup.setAttribute("transform","translate("+pup.ctx+","+pup.cty+") rotate(270) scale(.75)");
            pup.move=function(){
                this.ctx+=this.speed*Math.cos((this.angle)* (Math.PI/180));
                this.cty+=this.speed*Math.sin((this.angle)* (Math.PI/180));
                if (this.ctx<0)this.ctx+=width;
                if (this.cty<0)this.cty+=height;
                if (this.ctx>width)this.ctx-=width;
                if (this.cty>height)this.cty-=height;
                this.setAttribute("transform","translate("+this.ctx+","+this.cty+") rotate(270) scale(.75)");
                if (game.ship.isVisible){
                    var distance=Math.sqrt(Math.pow((game.ship.ctx-this.ctx),2)+Math.pow((game.ship.cty-this.cty),2));
                    if (distance<this.radius){
                        this.life=0;
                        this.func();
                    }
                }
                this.life--;
                if (this.life<=0){ //powerup decay
                    try{
                        game.board.removeChild(this);
                    }catch(e){
                        var z=null;
                    } //already removed
                    game.powerups.splice(game.powerups.indexOf(this),1);
                }
            }
            game.powerups.push(pup);
            this.board.insertBefore(pup,this.ship);
        }
    }

    addLife(){
        var littleShip=this.ship.chasis.cloneNode();
        littleShip.setAttribute("class", "life-pup");
        littleShip.setAttribute("transform","translate("+(width-20 -this.hud.lifes.length*40)+","+(height-20)+") rotate(270)");
        this.hud.lifes.push(littleShip);
        this.hud.appendChild(littleShip);
        this.lifes++;
    }
    
    removeLife(){
        //TODO: animate death do explossion or something
        this.ship.isVisible=false;
        this.ship.setAttribute("style","fill-opacity:0;stroke-opacity:0");
        if (--this.lifes >= 0){
            const littleShip=this.hud.lifes.pop();
            try{
                this.hud.removeChild(littleShip);
            }catch (e){}
            window.setTimeout( () => this.startLife() , 2000);
        }else{
            let ac=this.bulletsHit/this.bulletsFired*100;
            if (!ac) ac=0;
            window.setTimeout( () => {
                this.hud.alert("Juego Terminado!\n\nNivel: "+this.level+"\nPrecisión: "+ ac.toFixed(2)+"%\n\nPresiona cualquier tecla para continuar")
                this.newGameMsgVisible= true;
            } , 2000)
        }
    }
    
    addTeleport(){
        var tele=this.ship.chasis.cloneNode();
        tele.setAttribute("style","fill:none;stroke:#000;stroke-width:2");
        tele.setAttribute("transform","translate("+(20+this.hud.teleports.length*40)+","+(height-20)+") rotate(270)");
        this.hud.teleports.push(tele);
        this.hud.appendChild(tele);
        this.ship.teleportsLeft++;
    }
    
    useTeleport(){
        this.ship.teleportsframesleft=this.ship.teleportsDelay;
        this.ship.sx=0;
        this.ship.sy=0;
        this.ship.ctx=Math.random()*width;
        this.ship.cty=Math.random()*height;
        this.ship.angle=Math.round(Math.random()*23)*15;
        var tele=this.hud.teleports.pop();
        this.ship.shield.auto=5;
        try{
            this.hud.removeChild(tele);
        }catch (e){
            var z=null;
        }
        this.ship.teleportsLeft--;
    }
    
    startLife(){
        if(this.lifes >= 0){
            this.paused=false;
            this.ship.shield.auto=this.ship.shield.Max/2;
            this.ship.shield.enabled=true;
            this.ship.radius=40;
            this.ship.ctx=width/2; //center x coord (pixels)
            this.ship.cty=height/2; //center y coord (pixels)
            this.ship.sx=0; //speed in x (pixels each frame)
            this.ship.sy=0; //speed in y (pixels each frame)
            this.ship.angle=270; //angle of the ship (plus 180 degrees)
            this.ship.teleportsframesleft=0; 
            this.ship.fireleft=0; //delay counter 0 or less means you can fire again
            this.ship.setAttribute("style","fill-opacity:1;stroke-opacity:1");
            this.ship.setAttribute("transform","translate("+this.ship.ctx+","+this.ship.cty+") rotate("+this.ship.angle+")");
            this.ship.isVisible=true;
        }
    }
    
    newLevel(){
        this.level++;
        this.ship.shield.auto=5;
        for (var i=0 ; i < this.level ; i++){
            this.addAsteroid();
        }
    }
    
    start(){
        this.bulletsFired=0;
        this.bulletsHit=0;
        this.lifes=0;
        for (var i=0;i<2;i++){
            this.addLife();
        }
        this.ship.teleportsLeft=0;//only trough powerups
        this.ship.shield.left=0;//only trough powerups
        this.hud.updateShield();
        for (let a in this.asteroids){
            this.board.removeChild(this.asteroids[a])
        }
        for (let p in this.powerups){
            this.board.removeChild(this.powerups[p])
        }        
        this.asteroids=new Array();
        this.powerups=new Array();
        this.level=0;
        this.newLevel();
        this.startLife();
    }
    
}

