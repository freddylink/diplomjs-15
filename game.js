'use strict';
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    };

    plus(vector) {
        if (vector instanceof Vector) {
          return new Vector(this.x + vector.x, this.y + vector.y);
        }
        throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }

    times(factor) {
        return new Vector(this.x * factor, this.y *factor);
    }
}

class Actor {
    constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
        if ([pos, size, speed].some((vector) => !(vector instanceof Vector))) {
            throw new Error('Можно передавать только объекты типа Vector');
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act() {}

    get type() {
        return 'actor';
    }

    get left() {
        return this.pos.x;
    }
    get right() {
        return this.pos.x + this.size.x;
    }
    get top() {
        return this.pos.y;
    }
    get bottom() {
        return this.pos.y + this.size.y;
    }

    isIntersect(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('Можно передавать только объекты типа Actor');
        }

        if (actor === this) {
            return false;
        }
        return this.right > actor.left && this.left < actor.right && this.bottom > actor.top && this.top < actor.bottom;
    }

}

class Level{
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        this.player = actors.find(item => item.type === 'player');
        this.height = this.grid.length;
        this.width = Math.max(0, ...this.grid.map(cell => cell.length));
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actor) {
        if (!actor || !(actor instanceof Actor)) {
            throw new Error('Можно передавать только объекты типа Actor и аргумент не может быть пустым');
        }
        return this.actors.find(elem => actor.isIntersect(elem));
    }

    obstacleAt(pos, size) {
        if (!(pos instanceof Vector) || !(size instanceof Vector)) {
            throw new Error('Можно передавать только объекты типа Vector');
        }

        const topBorder = pos.y;
        const rightBorder = pos.x + size.x;
        const bottomBorder = pos.y + size.y;
        const leftBorder = pos.x;

        if (leftBorder < 0 || topBorder < 0 || rightBorder > this.width) {
            return 'wall'
        }

        if (bottomBorder > this.height) {
            return 'lava';
        }

        const minTop = Math.floor(topBorder);
        const maxBottom = Math.ceil(bottomBorder);
        const minLeft = Math.floor(leftBorder);
        const maxRight = Math.ceil(rightBorder);

        for (let y = minTop; y < maxBottom; y++) {
            for (let x = minLeft; x < maxRight; x++) {
                const fieldType = this.grid[y][x];
                if (fieldType) {
                    return fieldType;
                }
            }
        }
    }

    removeActor(actor) {
        for (let i = 0; i < this.actors.length; i++) {
            if (actor === this.actors[i]) {
                this.actors.splice(i,1);
                return;
            }
        }
    }

    noMoreActors(type) {
        return !this.actors.some(actor => actor.type === type);
    }

    playerTouched(type, obj) {
        if (typeof type !== 'string') {
            throw new Error(`В первом параметре метода playerTouched, должна быть строка`);
        }

        if (this.status !== null) {
            return false;
        }

        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost';
        }
        if (type === 'coin' && obj.type === 'coin') {
            this.removeActor(obj);
            if (this.noMoreActors(type)) {
                this.status = 'won';
            }
        }
    }
}

class LevelParser {
    constructor(dictionary = {}) {
        this.dictionary = Object.assign({}, dictionary);
    }

    actorFromSymbol(symbol) {
        return this.dictionary[symbol];
    }

    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        }
    }

    createGrid(arrString) {
        return arrString.map(row => row.split('').map(cell => this.obstacleFromSymbol(cell)));
    }

    createActors(arrString) {
        const arr = [];
        if (arrString.length != 0 && this.dictionary !== undefined) {
            arrString.forEach((row, rowIndex) => {
                row.split('').forEach((cell, cellIndex) => {
                    const dictionary = this.actorFromSymbol(cell);
                    if (Actor.isPrototypeOf(dictionary) || dictionary === Actor) {
                        arr.push(new dictionary(new Vector(cellIndex, rowIndex)));
                    }
                });
            });
            return arr;
        }
        return [];
    }


    parse(arrString) {
        return new Level(this.createGrid(arrString), this.createActors(arrString));
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super(pos, new Vector(1, 1), speed);
    }

    get type() {
        return "fireball";
    }

    getNextPosition(time = 1) {
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, level) {
        const newPosition = this.getNextPosition(time);
        if (level.obstacleAt(newPosition, this.size) === undefined) {
            this.pos = newPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 3));
        this.basePos = pos;
    }

    handleObstacle() {
        this.pos = this.basePos;
    }
}

class Coin extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0.2,0.1)), new Vector(0.6, 0.6));
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
        this.basePos = this.pos;
    }

    get type() {
        return "coin";
    }

    updateSpring(time = 1) {
        this.spring = this.spring + this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.basePos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
    }

    get type() {
        return "player";
    }
}

const actors = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
};
const parser = new LevelParser(actors);

loadLevels()
    .then(
        response => {
            runGame(JSON.parse(response), parser, DOMDisplay).then(() => alert('Вы выиграли!'));
        },
        error => alert(`Error: ${error}`)
    );
