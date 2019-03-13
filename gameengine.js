window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (/* function */ callback, /* DOMElement */ element) {
				window.setTimeout(callback, 1000 / 60);
			};
})();

function GameEngine() {
	this.projectiles = [];
	this.planets = [];
	this.cannon = [];
	this.ctx = null;
	this.surfaceWidth = null;
	this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
	this.ctx = ctx;
	this.surfaceWidth = this.ctx.canvas.width;
	this.surfaceHeight = this.ctx.canvas.height;
	this.timer = new Timer();
	console.log('game initialized');
}

GameEngine.prototype.start = function () {
	console.log("starting game");
	var that = this;
	(function gameLoop() {
		that.loop();
		requestAnimFrame(gameLoop, that.ctx.canvas);
	})();
}

GameEngine.prototype.addEntity = function (entity) {
	// console.log('added entity');
	if (entity.name === "Projectile") {
		this.projectiles.push(entity);
	}
	if (entity.name === "Planet") {
		this.planets.push(entity);
	}
	if (entity.name === "Cannon") {
		this.cannon.push(entity);
	}
}

GameEngine.prototype.draw = function () {
	this.ctx.clearRect(0, 0, this.surfaceWidth, this.surfaceHeight);
	this.ctx.save();

	for (var i = 0; i < this.projectiles.length; i++) {
		this.projectiles[i].draw(this.ctx);
	}
	for (var i = 0; i < this.planets.length; i++) {
		this.planets[i].draw(this.ctx);
	}
	for (var i = 0; i < this.cannon.length; i++) {
		this.cannon[i].draw(this.ctx);
	}

	this.ctx.restore();
}

GameEngine.prototype.update = function () {
	var count = this.projectiles.length;
	//console.log("Projectiles: " + count);
	for (var i = 0; i < count; i++) {
		var entity = this.projectiles[i];
		if (entity.removeFromWorld) {
			this.projectiles.splice(i, 1);
			i--;
			count--;
		}
		else {
			entity.update();
		}
	}

	count = this.planets.length;
	for (var i = 0; i < count; i++) {
		var entity = this.planets[i];
		if (entity.removeFromWorld) {
			this.planets.splice(i, 1);
			i--;
			count--;
		}
		else {
			entity.update();
		}
	}

	count = this.cannon.length;
	for (var i = 0; i < count; i++) {
		var entity = this.cannon[i];
		if (entity.removeFromWorld) {
			this.cannon.splice(i, 1);
			i--;
			count--;
		}
		else {
			entity.update();
		}
	}
}

GameEngine.prototype.loop = function () {
	this.clockTick = this.timer.tick();
	this.update();
	this.draw();
}

function Timer() {
	this.gameTime = 0;
	this.maxStep = 0.05;
	this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
	var wallCurrent = Date.now();
	var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
	this.wallLastTimestamp = wallCurrent;

	var gameDelta = Math.min(wallDelta, this.maxStep);
	this.gameTime += gameDelta;
	return gameDelta;
}

function Entity(game, x, y) {
	this.game = game;
	this.x = x;
	this.y = y;
	this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
	if (this.game.showOutlines && this.radius) {
		this.game.ctx.beginPath();
		this.game.ctx.strokeStyle = "green";
		this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		this.game.ctx.stroke();
		this.game.ctx.closePath();
	}
}

Entity.prototype.rotateAndCache = function (image, angle) {
	var offscreenCanvas = document.createElement('canvas');
	var size = Math.max(image.width, image.height);
	offscreenCanvas.width = size;
	offscreenCanvas.height = size;
	var offscreenCtx = offscreenCanvas.getContext('2d');
	offscreenCtx.save();
	offscreenCtx.translate(size / 2, size / 2);
	offscreenCtx.rotate(angle);
	offscreenCtx.translate(0, 0);
	offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
	offscreenCtx.restore();
	//offscreenCtx.strokeStyle = "red";
	//offscreenCtx.strokeRect(0,0,size,size);
	return offscreenCanvas;
}