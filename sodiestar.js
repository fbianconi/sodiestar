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

/*instructions
 * add:

<html><head>
<meta http-equiv="content-type" content="text/html;charset=utf-8" />
<script type="text/javascript" src="sodiestar.js"></script>
</head><body style="text-align:center;" /></html>

 * to the head of an empty html file (on the same folder) and have fun.
 * 
 * It should work on recent chrome/chromium
 * If it doesn't work for you, well, patches are welcome :)
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
 * 
 */

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
  // game constructor(){
	var svgns="http://www.w3.org/2000/svg";
  var board=document.createElementNS(svgns,"svg");
  var hud=document.createElementNS(svgns,"g");
	var width=800;
	var height=600;
  
  var game=new Object();
  var keyspressed="";
  game.bullets=new Array();
  game.asteroids=new Array();
  game.powerups=new Array();
  game.powerupProbability=0.05;
  var PiOver180=Math.PI/180;
  var l80OverPI=180/Math.PI;
  
  //TODO: make all the style css-able - NOT LIKELY
	board.setAttribute("style","position:relative;border:1px solid black;width:"+width+"px;height:"+height+"px;background-color:#eef;margin:0 auto 0 auto;");
	document.body.appendChild(board);
  var ship = document.createElementNS(svgns,"g");
  //todo: save resources to another file? - NOT LIKELY
  ship.chasis=document.createElementNS(svgns,"path");
  ship.chasis.setAttribute("d","m 15,0 -17,-10 2,-3 -15,-2 6,8 -3,7 3,7 -6,8 15,-2 -2,-3 z");
  ship.chasis.setAttribute("style","fill:#aaf;stroke:#000;stroke-width:1;");
  ship.cockpit=document.createElementNS(svgns,"path");
  ship.cockpit.setAttribute("d","m 8,0 -10,-5 0,10 z");
  ship.cockpit.setAttribute("style","fill:#bde;stroke:#000;stroke-width:1");
  ship.shield=document.createElementNS(svgns,"circle");
  ship.shield.setAttribute("r",40);
  ship.shield.setAttribute("style","position:relative;fill:#048;fill-opacity:.3;stroke:#048;stroke-width:1px;");
  ship.appendChild(ship.chasis);
  ship.appendChild(ship.cockpit);
  ship.appendChild(ship.shield);
	board.appendChild(ship);
  board.appendChild(hud);
  hud.lifes=new Array();
  hud.teleports=new Array();
  
  hud.shieldPlace=document.createElementNS(svgns,"rect");
  hud.shieldPlace.setAttribute("style","fill:none;stroke:#000;stroke-width:2px;stroke-opacity:.3");
  hud.shieldPlace.setAttribute("x",width/2-50);
  hud.shieldPlace.setAttribute("y",height-40);
  hud.shieldPlace.setAttribute("width",100);
  hud.shieldPlace.setAttribute("height",30);
  hud.shieldAmount=document.createElementNS(svgns,"rect");
  hud.shieldAmount.setAttribute("style","stroke:none;fill:#048;fill-opacity:.3;");
  hud.shieldAmount.setAttribute("x",width/2-48);
  hud.shieldAmount.setAttribute("y",height-38);
  hud.shieldAmount.setAttribute("width",0);//min=0; max=96;
  hud.shieldAmount.setAttribute("height",26);
  hud.appendChild(hud.shieldPlace);
  hud.appendChild(hud.shieldAmount);
  
  ship.shield.Max=100; //frames
  ship.accel=0.24; 
  ship.teleportsDelay=3; 
  ship.isVisible=true;
  ship.radius=8;
  ship.firedelay=3; //in frames delay between 2 shots
  
  var txt = document.createElement("div");
  document.body.appendChild(txt);
  
  ship.fire=function(){
    if (ship.fireleft<=0 && ship.isVisible){
      bullet=document.createElementNS(svgns,"path");
      bullet.radius=3;
      var x = 2*bullet.radius*Math.cos((ship.angle)* PiOver180);
      var y = 2*bullet.radius*Math.sin((ship.angle)* PiOver180);
      bullet.setAttribute("d","m 0,0 "+x+","+y);
      bullet.setAttribute("style","position:relative;stroke:#000000;stroke-width:2px;");
      bullet.setAttribute("transform","translate("+bullet.ctx+","+bullet.cty+")");
      bullet.ctx=ship.ctx;
      bullet.cty=ship.cty;
      bullet.angle=ship.angle;
      bullet.speed=20;
      bullet.life=Math.min(width,height)*.95/20;
      bullet.move=function(){
        this.ctx+=this.speed*Math.cos((this.angle)* PiOver180);
        this.cty+=this.speed*Math.sin((this.angle)* PiOver180);
        this.setAttribute("transform","translate("+this.ctx+","+this.cty+")");
        if (this.ctx<0)this.ctx+=width;
        if (this.cty<0)this.cty+=height;
        if (this.ctx>width)this.ctx-=width;
        if (this.cty>height)this.cty-=height;
        for (x in game.asteroids){ // bullet-asteroid hit check
          var distance=Math.sqrt(Math.pow((this.ctx-game.asteroids[x].ctx),2)+Math.pow((this.cty-game.asteroids[x].cty),2));
          if (distance<game.asteroids[x].radius){
            try{
              board.removeChild(this);
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
            board.removeChild(this);
          }catch(e){
            var z=null;
          } //already removed
          game.bullets.splice(game.bullets.indexOf(this),1);
        }
      }
      board.insertBefore(bullet,ship);
      game.bullets.push(bullet);
      ship.fireleft=ship.firedelay;
      game.bulletsFired++;
    }
  }

  game.addAsteroid=function(ax, ay, aa, ar){
    var asteroid=document.createElementNS(svgns,"circle");
    asteroid.radius=(ar?ar:40);
    asteroid.ctx=(ax?ax:Math.random()*width);
    asteroid.cty=(ay?ay:Math.random()*height);
    asteroid.angle=(aa?aa:Math.random()*360);
    asteroid.speed=Math.random()*10; //maxspeed=10
    asteroid.setAttribute("r",asteroid.radius);
    asteroid.setAttribute("style","position:relative;fill:#987;stroke:#000000;stroke-width:1px;");
    asteroid.setAttribute("transform","translate("+asteroid.ctx+","+asteroid.cty+")");
    asteroid.move=function(){
      this.ctx+=this.speed*Math.cos((this.angle)* PiOver180);
      this.cty+=this.speed*Math.sin((this.angle)* PiOver180);
      if (this.ctx<0)this.ctx+=width;
      if (this.cty<0)this.cty+=height;
      if (this.ctx>width)this.ctx-=width;
      if (this.cty>height)this.cty-=height;
      this.setAttribute("transform","translate("+this.ctx+","+this.cty+")");
      if (ship.isVisible){
        var distance=Math.sqrt(Math.pow((ship.ctx-this.ctx),2)+Math.pow((ship.cty-this.cty),2));
        if (distance<(this.radius+ship.radius)){ //ship crash
          this.hit();
          if (ship.shield.enabled!=true){
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
          board.removeChild(this);
        }catch(e){
          var z=null;
        } //already removed
        game.asteroids.splice(game.asteroids.indexOf(this),1);
        if (game.asteroids.length==0){
          //txt.innerText="Level Cleared - acuracy : "+(game.bulletsHit/game.bulletsFired*100)+"%";
          setTimeout(game.newLevel, 2000);
        }
      }else{
        this.setAttribute("r",this.radius);
        var angle=this.angle;
        this.angle=(angle+Math.random()*180)-90;
        game.addAsteroid(this.ctx,this.cty,(angle+Math.random()*180)-90,this.radius);
      }
    }
    board.insertBefore(asteroid,ship);
    game.asteroids.push(asteroid);
    return asteroid;
  }

  game.powerUp=function(ax,ay,angle,speed){
    if (Math.random() < game.powerupProbability){
      var item=Math.random();
      var pup=null;
      //TODO:fix probabilities
      if (item<.2){//life
        pup=ship.chasis.cloneNode();
        pup.setAttribute("style","fill:#000;stroke:none;fill-opacity:.3");
        pup.life=100;//frames
        pup.func=game.addLife;
      }else if (item<.6){//shield
        pup=document.createElementNS(svgns,"circle");
        pup.setAttribute("style","fill:#048;fill-opacity:.3;stroke:#048;stroke-width:2px;");
        pup.setAttribute("r","20");
        pup.func=function(){
          ship.shield.left+=40;
          hud.updateShield();
        }
        pup.life=150;//frames
      }else{//teleport
        pup=ship.chasis.cloneNode();
        pup.setAttribute("style","fill:none;stroke:#000;stroke-width:2;stroke-opacity:.3");
        pup.life=80;//frames
        pup.func=game.addTeleport;
      }
      pup.ctx=ax;
      pup.cty=ay;
      pup.angle=angle;
      pup.speed=speed;
      pup.radius=20;
      pup.setAttribute("transform","translate("+pup.ctx+","+pup.cty+") rotate(270) scale(.75)");
      pup.move=function(){
        this.ctx+=this.speed*Math.cos((this.angle)* PiOver180);
        this.cty+=this.speed*Math.sin((this.angle)* PiOver180);
        if (this.ctx<0)this.ctx+=width;
        if (this.cty<0)this.cty+=height;
        if (this.ctx>width)this.ctx-=width;
        if (this.cty>height)this.cty-=height;
        this.setAttribute("transform","translate("+this.ctx+","+this.cty+") rotate(270) scale(.75)");
        if (ship.isVisible){
          var distance=Math.sqrt(Math.pow((ship.ctx-this.ctx),2)+Math.pow((ship.cty-this.cty),2));
          if (distance<this.radius){
            this.life=0;
            this.func();
          }
        }
        this.life--;
        if (this.life<=0){ //powerup decay
          try{
            board.removeChild(this);
          }catch(e){
            var z=null;
          } //already removed
          game.powerups.splice(game.powerups.indexOf(this),1);
        }
      }
      game.powerups.push(pup);
      board.insertBefore(pup,ship);
    }
  }

  game.addLife=function(){
    var littleShip=ship.chasis.cloneNode();
    littleShip.setAttribute("style","fill:#000;stroke:none;fill-opacity:.3");
    littleShip.setAttribute("transform","translate("+(width-20 -hud.lifes.length*40)+","+(height-20)+") rotate(270)");
    hud.lifes.push(littleShip);
    hud.appendChild(littleShip);
    game.lifes++;
  }
  
  game.removeLife=function(){
    //TODO: animate death
    ship.isVisible=false;
    ship.setAttribute("style","fill-opacity:0;stroke-opacity:0");
    setTimeout(game.startLife, 2000);
    var littleShip=hud.lifes.pop();
    try{
      hud.removeChild(littleShip);
    }catch (e){
      var z=null;
    }
    game.lifes--;
  }
  
  game.addTeleport = function(){
    //TODO draw a real teleport icon
    var tele=ship.chasis.cloneNode();
    tele.setAttribute("style","fill:none;stroke:#000;stroke-width:2");
    tele.setAttribute("transform","translate("+(20+hud.teleports.length*40)+","+(height-20)+") rotate(270)");
    hud.teleports.push(tele);
    hud.appendChild(tele);
    ship.teleportsLeft++;
  }
  
  game.useTeleport = function(){
    ship.teleportsframesleft=ship.teleportsDelay;
    ship.sx=0;
    ship.sy=0;
    ship.ctx=Math.random()*width;
    ship.cty=Math.random()*height;
    ship.angle=Math.round(Math.random()*23)*15;
    var tele=hud.teleports.pop();
    ship.shield.auto=5;
    try{
      hud.removeChild(tele);
    }catch (e){
      var z=null;
    }
    ship.teleportsLeft--;
  }
  
  game.startLife=function(){
    if(game.lifes>=0){
      game.paused=false;
      ship.shield.auto=ship.shield.Max/2;
      ship.shield.enabled=true;
      ship.radius=40;
      ship.ctx=width/2; //center x coord (pixels)
      ship.cty=height/2; //center y coord (pixels)
      ship.sx=0; //speed in x (pixels each frame)
      ship.sy=0; //speed in y (pixels each frame)
      ship.angle=270; //angle of the ship (plus 180 degrees)
      ship.teleportsframesleft=0; 
      ship.fireleft=0; //delay counter 0 or less means you can fire again
      ship.setAttribute("style","fill-opacity:1;stroke-opacity:1");
      ship.setAttribute("transform","translate("+ship.ctx+","+ship.cty+") rotate("+ship.angle+")");
      ship.isVisible=true;
    }else{
      //TODO do something else
      var ac=game.bulletsHit/game.bulletsFired*100;
      hud.alert("Juego Terminado!\n\nNivel: "+game.level+"\nPrecisión: "+ ac.toFixed(2)+"%\n\nPresiona f5 para reiniciar");
    }
  }
  
  game.newLevel= function(){
    game.level++;
    ship.shield.auto=5;
    for (i=0;i<game.level;i++){
      game.addAsteroid();
    }
  }
    
  game.newGame=function(){
    game.bulletsFired=0;
    game.bulletsHit=0;
    game.lifes=0;
    for (i=0;i<2;i++){
      game.addLife();
    }
    ship.teleportsLeft=0;//only trough powerups
    ship.shield.left=0;//only trough powerups
    hud.updateShield();
    game.level=0;
    game.newLevel();
    game.startLife();
  }
  
  hud.updateShield=function(){
    if (ship.shield.left>ship.shield.Max)ship.shield.left=ship.shield.Max;
    hud.shieldAmount.setAttribute("width",ship.shield.left/ship.shield.Max*96);//min=0; max=96;
  }
  
  hud.alert=function(message, time){
    if (message==""){
      hud.removeChild(hud.msg);
    }else{
      hud.msg=document.createElementNS(svgns,"g");
      hud.msg.rect=document.createElementNS(svgns,"rect");
      hud.msg.rect.setAttribute("style","fill:#000;fill-opacity:.7");
      
      hud.msg.text=document.createElementNS(svgns,"text");
      hud.msg.text.setAttribute("style","stroke:#none;fill:#fff");
      hud.msg.appendChild(hud.msg.rect);
      hud.msg.appendChild(hud.msg.text);
      hud.appendChild(hud.msg);
      var mySplit = message.split("\n");
      if (mySplit.length==1){
        hud.msg.text.textContent=message;
      }else{
        for (i in mySplit){
          var tspan=document.createElementNS(svgns,"tspan");
          tspan.textContent=mySplit[i];
          hud.msg.text.appendChild(tspan);//we have to show it to know how much space it takes
          var ww=tspan.offsetWidth;
          var hh=tspan.offsetHeight;
          tspan.setAttribute("y",hh*i-hh*mySplit.length/2+14);//I wish there was a better way to do this
          tspan.setAttribute("x",ww/-2);
        }
      }
      var w = hud.msg.text.offsetWidth;
      var h = hud.msg.text.offsetHeight;

      hud.msg.rect.setAttribute("x",w/-2-10);//and this
      hud.msg.rect.setAttribute("y",h/-2-5);
      hud.msg.rect.setAttribute("width",w+20);
      hud.msg.rect.setAttribute("height",h+10);
      hud.msg.text.setAttribute("x",w/-2);
      hud.msg.text.setAttribute("y",h/2-5);
      
      hud.msg.setAttribute("transform","translate("+width/2+","+height/2+")");
      if (time){ //I thoght it could be useful to have a timeout, now not so much
        setTimeout("hud.alert('');", time);
      }
    }
  }

  ship.shield.enable=function(val){
    ship.shield.enabled=val;
    ship.radius=(val?40:8);
    ship.shield.setAttribute("style","position:relative;fill:#048;fill-opacity:"+(val?.3:0)+";stroke:#048;stroke-width:1px;stroke-opacity:"+(val?1:0));
    hud.updateShield();
  }
  
  var timer=null;
  //todo: make real loop? - NOT LIKELY
  var tf=function(){//main "loop" every 40ms (25fps)
    if (!game.paused){
      //general delays
      ship.fireleft--;
      ship.teleportsframesleft--;
      
      if (keyspressed.indexOf(":90")!= -1 ){ //z (auto brakes)
        keyspressed=keyspressed.replace(":37x", "");//auto-left
        keyspressed=keyspressed.replace(":38x", "");//auto-up
        keyspressed=keyspressed.replace(":39x", "");//auto-right
        if (Math.abs(ship.sx)<ship.accel && Math.abs(ship.sy)<ship.accel){
          ship.sx=0;
          ship.sy=0;
          //otherwise it'll never stop, yes I cheated
        }else{
          var advAngle=(Math.atan2(ship.sy,ship.sx)*l80OverPI);
          if (advAngle<0)advAngle+=360;
          var diff = advAngle-ship.angle;
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
        ship.angle-=15;
        if (ship.angle<0) ship.angle=360-15;
      }
      if (keyspressed.indexOf(":39")!= -1 ){ //right
        ship.angle+=15;
        if (ship.angle==360) ship.angle=0;
      }
      if (keyspressed.indexOf(":38")!= -1 ){ //up
        ship.sx+=ship.accel*Math.cos((ship.angle)* PiOver180);
        ship.sy+=ship.accel*Math.sin((ship.angle)* PiOver180);
      }
      if (keyspressed.indexOf(":17")!= -1 ){ //ctrl (shot)
        ship.fire();
      }
      if (ship.shield.auto>=0){ //auto shield
        ship.shield.auto--; //disabled for testing
        ship.shield.enable(true);
      }else{
        if (keyspressed.indexOf(":16")!= -1 && ship.shield.left>0 && ship.isVisible){ //shift (shield)
          ship.shield.left--;
          ship.shield.enable(true);
        }else{ //its a pulsator
          ship.shield.enable(false);
        }
      }
      if (keyspressed.indexOf(":91")!= -1 && ship.teleportsLeft>0 && ship.teleportsframesleft<0 ){ //super (aka windows logo) (teleport)
        game.useTeleport();
      }
      if (keyspressed.indexOf(":80")!= -1 ){ //p (pause)
        keyspressed=keyspressed.replace(":80", "");
        hud.alert("Pausa, presiona 'p' para continuar");
        game.paused=true;
      }
      
      //ship.move(){
      ship.ctx+=ship.sx;
      ship.cty+=ship.sy;
      if(ship.ctx>width)ship.ctx-=width;
      if(ship.cty>height)ship.cty-=height;
      if(ship.ctx<0)ship.ctx+=width;
      if(ship.cty<0)ship.cty+=height;
      ship.setAttribute("transform","translate("+ship.ctx+","+ship.cty+") rotate("+ship.angle+")");
      //}      
      for (x in game.asteroids){
        game.asteroids[x].move();
      }
      for (i in game.bullets){
        game.bullets[i].move();
      }
      for (i in game.powerups){
        game.powerups[i].move();
      }
    }else{
      if (keyspressed.indexOf(":80")!= -1 ){ //p (pause)
        keyspressed=keyspressed.replace(":80", "");
        game.paused=false;
        hud.alert("");
      }
    }
    timer=setTimeout(tf, 45);
  }
  //TODO: make unobtrusive?
  window.onkeydown=function(evt){
    keynum=evt.which;
    keyspressed=keyspressed.replace(":"+keynum, "");
    keyspressed+=":"+keynum; //simply pull
    //txt.innerText=keyspressed;
  }
  window.onkeyup=function(evt){
    keynum=evt.which;
    keyspressed=keyspressed.replace(":"+keynum, "");
    //txt.innerText=keyspressed;
  }
  hud.alert("Flechas Izq, Der, Arr - dirigen la nave\nCtrl - dispara\nShift - escudo\nZ - freno\nMeta - teleport\n\npartida en pausa, presiona 'p' para continuar");
  game.newGame();
  game.paused=true;
  tf();  
});



