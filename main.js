var ACCELERATION = 1000000;
var GRAVITY_INTENSITY = 20;
var MAX_SPEED = 2000;

function distance(a, b) {
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

function direction(a, b) {
	var dx = a.x - b.x;
	var dy = a.y - b.y;
	var dist = Math.sqrt(dx * dx + dy * dy);
	if(dist > 0) return { x: dx / dist, y: dy / dist }; else return {x:0,y:0};
}

function collide(a, b) {
	return distance(a, b) < a.radius + b.radius;
}

function randomInt(n) {
	return Math.floor(Math.random() * n);
}

/* ================================================================================ */
// socket.io Stuff
/* ================================================================================ */

window.onload = function () {
	var socket = io.connect("http://24.16.255.56:8888");

	socket.on("load", function (data) {
		console.log(data);

		for (var i = 0; i < GAME_ENGINE.projectiles.length; i++) {
			GAME_ENGINE.projectiles[i].removeFromWorld = true;
		}
		for (var i = 0; i < data.numProjectiles; i++) {
			var projectile = new Projectile(GAME_ENGINE);

			projectile.x = data.projInfo[i].posX;
			projectile.y = data.projInfo[i].posY;
			projectile.velocity = data.projInfo[i].vel;

			GAME_ENGINE.addEntity(projectile);
		}

		GAME_ENGINE.theCannon.angle = data.cannonAngle;
		GAME_ENGINE.theCannon.adjustPow = data.adjustPow;
		GAME_ENGINE.theCannon.impact = data.previousImpact;
		GAME_ENGINE.theCannon.previous = data.previousAdjust;
	});

	var text = document.getElementById("text");
	var saveButton = document.getElementById("save");
	var loadButton = document.getElementById("load");

	saveButton.onclick = function () {
		console.log("save");
		text.innerHTML = "Saved.";

		var p = GAME_ENGINE.projectiles.length;
		proj = [];

		for (var i = 0; i < p; i++) {
			proj[i] = {posX: GAME_ENGINE.projectiles[i].x,
					   posY: GAME_ENGINE.projectiles[i].y,
					   vel: GAME_ENGINE.projectiles[0].velocity};
		}

		socket.emit("save", {studentname: "Brian Mathew",
							 statename: "currentState",
							 numProjectiles: p,
							 projInfo: proj,
							 cannonAngle: GAME_ENGINE.theCannon.angle,
							 adjustPow: GAME_ENGINE.theCannon.adjustPow,
							 previousImpact: GAME_ENGINE.theCannon.impact,
							 previousAdjust: GAME_ENGINE.theCannon.previous});
	};

	loadButton.onclick = function () {
		console.log("load");
		socket.emit("load", {studentname: "Brian Mathew",
							 statename: "currentState"});
	};
};

/* ================================================================================ */
// Cannon and projectile
/* ================================================================================ */

function Cannon(game) {
	this.name = "Cannon";
	this.x = 400;
	this.y = 800;
	this.radius = 20;
	this.angle = randomInt(180);
	this.fire = true;
	this.impact = "None";
	this.previous = "None";
	this.adjustPow = 0;

	this.game = game;
	this.ctx = game.ctx;
	this.removeFromWorld = false;
}

Cannon.prototype = new Entity(this);
Cannon.prototype.constructor = Cannon;

Cannon.prototype.update = function() {
	// console.log("Angle: " + this.angle);
	// console.log("AdjustPow: " + this.adjustPow);
	// console.log("impact: " + this.impact);
	// console.log("Previous adjust: " + this.previous);

	if ((this.impact === "Edge" && this.angle < 90 && this.angle > 0) ||
		(this.impact === "Planet" && this.angle >= 90 && this.angle < 180)) {
		this.impact = "None";
		if (this.previous === "Right") {
			this.adjustPow++;
		}
		this.previous = "Left";
		this.angle += (1 * 1 / Math.pow(2, this.adjustPow));
		console.log("Adjusting to the left...");
	}
	if ((this.impact === "Edge" && this.angle >= 90 && this.angle < 180) ||
		(this.impact === "Planet" && this.angle < 90 && this.angle > 0)) {
		this.impact = "None";
		if (this.previous === "Left") {
			this.adjustPow++;
		}
		this.previous = "Right";
		this.angle -= (1 * 1 / Math.pow(2, this.adjustPow));
		console.log("Adjusting to the right...");
	}

	if (this.angle > 180) {
		this.angle = 0;
	}
	else if (this.angle < 0) {
		this.angle = 0;
	}

	if (this.fire) {
		this.fire = false;
		console.log("Firing at angle: " + this.angle);
		this.createProjectile();
	}
}

Cannon.prototype.draw = function() {
	this.ctx.beginPath();
	this.ctx.fillStyle = "Grey";
	this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
	this.ctx.fill();
	this.ctx.closePath();

	this.ctx.translate(400, 800);
	this.ctx.rotate(-this.angle * Math.PI / 180);
	this.ctx.translate(-400, -800);
	this.ctx.fillRect(400, 790, 40, 20);

	this.ctx.restore();
	
	Entity.prototype.draw.call(this);
}

Cannon.prototype.createProjectile = function() {
	var projectile = new Projectile(this.game);
	var target = {x: Math.cos(-this.angle * Math.PI / 180) * 1000 + this.x,
				  y: Math.sin(-this.angle * Math.PI / 180) * 1000 + this.y};
	var dir = direction(target, this);

	projectile.x = this.x;
	projectile.y = this.y;

	projectile.velocity.x = dir.x * projectile.maxSpeed;
	projectile.velocity.y = dir.y * projectile.maxSpeed;

	projectile.angle = this.angle * Math.PI / 180;

	this.game.addEntity(projectile);
}

function Projectile(game) {
	this.name = "Projectile";
	this.x = 400;
	this.y = 800;
	this.radius = 9;
	this.angle = 0;
	this.maxSpeed = MAX_SPEED;
	this.velocity = {x: 0, y: 0};

	this.game = game;
	this.ctx = game.ctx;
	this.removeFromWorld = false;
}

Projectile.prototype = new Entity(this);
Projectile.prototype.constructor = Projectile;

Projectile.prototype.update = function() {
	// console.log("X: " + this.x);
	// console.log("Y: " + this.y);
	// console.log("Velocity X: " + this.velocity.x);
	// console.log("Velocity Y: " + this.velocity.y);

	this.x += this.velocity.x * this.game.clockTick;
	this.y += this.velocity.y * this.game.clockTick;

	var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
	if (speed > this.maxSpeed) {
		var ratio = this.maxSpeed / speed;
		this.velocity.x *= ratio;
		this.velocity.y *= ratio;
	}

	if (this.x + 100 < 0 || this.x - 100 > 800 ||
		this.y + 100 < 0 || this.y - 100 > 800) {
		this.game.theCannon.impact = "Edge";
		this.removeFromWorld = true;
	}

	for (var i = 0; i < this.game.planets.length; i++) {
		var entity = this.game.planets[i];
		if (collide(this, entity)) {
			this.game.theCannon.impact = "Planet";
			this.removeFromWorld = true;
		}
	}

	if (this.removeFromWorld) {
		this.game.theCannon.fire = true;
	}

	Entity.prototype.update.call(this);
}

Projectile.prototype.draw = function() {
	this.ctx.beginPath();
	this.ctx.fillStyle = "Red";
	this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
	this.ctx.fill();
	this.ctx.closePath();

	Entity.prototype.draw.call(this);
}

/* ================================================================================ */
// Planet
/* ================================================================================ */

function Planet(game) {
	this.name = "Planet";
	this.x = 400;
	this.y = 400;
	this.radius = 50;
	this.angle = 0;

	this.game = game;
	this.ctx = game.ctx;
	this.removeFromWorld = false;
}

Planet.prototype = new Entity(this);
Planet.prototype.constructor = Planet;

Planet.prototype.update = function() {
	for (var i = 0; i < this.game.projectiles.length; i++) {
		var entity = this.game.projectiles[i];
		var dist = distance(this, entity);
		var difX = (entity.x - this.x) / dist;
		var difY = (entity.y - this.y) / dist;

		entity.velocity.x -= difX * ACCELERATION / (dist * dist) * GRAVITY_INTENSITY;
		entity.velocity.y -= difY * ACCELERATION / (dist * dist) * GRAVITY_INTENSITY;
	}
	Entity.prototype.update.call(this);
}

Planet.prototype.draw = function() {
	this.ctx.beginPath();
	this.ctx.fillStyle = "Green";
	this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
	this.ctx.fill();
	this.ctx.closePath();
	
	Entity.prototype.draw.call(this);
}

/* ================================================================================ */
// Main
/* ================================================================================ */


var ASSET_MANAGER = new AssetManager();
var GAME_ENGINE = new GameEngine();

ASSET_MANAGER.downloadAll(function () {
	console.log("starting up da sheild");
	var canvas = document.getElementById('gameWorld');
	var ctx = canvas.getContext('2d');

	GAME_ENGINE.init(ctx);
	GAME_ENGINE.start();
	GAME_ENGINE.theCannon = new Cannon(GAME_ENGINE);

	GAME_ENGINE.addEntity(new Planet(GAME_ENGINE));
	GAME_ENGINE.addEntity(GAME_ENGINE.theCannon);
});