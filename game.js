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

const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

//console.log(`Исходное расположение: ${start.x}:${start.y}`);
//console.log(`Текущее расположение: ${finish.x}:${finish.y}`);

class Actor {
    constructor(pos, size, speed) {
        if (!pos) {
            this.pos = new Vector();
        } else {
            if (pos instanceof Vector) {
                this.pos = pos;
            } else {
                throw new Error();
            }
        }
        if (!size) {
            this.size = new Vector(1, 1);
        } else {
            if (size instanceof Vector) {
                this.size = size
            } else {
                throw new Error();
            }
        }
        if (!speed) {
            this.speed = new Vector();
        } else {
            if (speed instanceof Vector) {
                this.speed = speed;
            } else {
                throw new Error();
            }

        }
        this.type;
        this.left;
        this.top;
        this.right;
        this.bottom;
    }

    act() {

    }

    get type() {
        return "actor";
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
        if (actor && actor instanceof Actor) {
            if (actor === this) {
                return false;
            }
            let centerX = (actor.right + actor.left) / 2;
            let centerY = (actor.bottom + actor.top) / 2;
            if (this.left < centerX && centerX < this.right && this.top < centerY && centerY < this.bottom) {
                  return true;
            }
            /*
            if (
                ((actor.left < this.right && actor.left >= this.left) && (centerY < this.bottom && centerY > this.top)) ||
                ((actor.right > this.left && actor.right <= this.right) && (centerY < this.bottom && centerY > this.top)) ||
                ((actor.top < this.bottom && actor.top >= this.top) && (centerX < this.right && centerX > this.left)) ||
                ((actor.bottom > this.top && actor.bottom <= this.bottom) && (centerX < this.right && centerX > this.left))
            ) {
                return true;
            }*/
            return false;
        }
        throw new Error();
    }

}
/*
const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
    return ['left', 'top', 'right', 'bottom']
        .map(side => `${side}: ${item[side]}`)
        .join(', ');
}

function movePlayer(x, y) {
    player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
    console.log(`${title}: ${position(item)}`);
    if (player.isIntersect(item)) {
        console.log(`Игрок подобрал ${title}`);
    }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);
*/
class Level{
    constructor(grid, actors) {
        if (grid) {
            this.grid = grid;
        } else {
            this.grid = [];
        }
        if (actors && actors.length > 0) {
            this.actors = actors;
        } else {
            this.actors = [];
        }
        for (let item of this.actors) {
            if (item.type === "player") {
                this.player = item;
            }
        }
        this.height = this.grid.length;
        this.width = 0;
        for (let elem of this.grid) {
            if (elem) {
                if (this.width < elem.length) {
                    this.width = elem.length;
                }
            }
        }
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        if (this.status !== null && this.finishDelay < 0) {
            return true;
        }
        return false;
    }

    actorAt(actor) {
        if (actor && actor instanceof Actor) {
            for (let elem of this.actors) {
              if (actor.isIntersect(elem)) {
                  return elem;
              }
            }
            return undefined;
        } else {
            throw new Error();
        }
    }

    obstacleAt(pos, size) {
        if ((pos && pos instanceof Vector) || (size && size instanceof Vector)) {
            let field = new Actor(new Vector(), new Vector(this.width, this.height));
            let obj = new Actor(pos, size);
            if(field.isIntersect(obj)) {
                if (this.actorAt(obj) !== "undefined") {
                    return this.grid[Math.floor(pos.x)][Math.floor(pos.y)];
                }
                return undefined;
            } else {
                if ((pos.x < 0 && pos.y >= 0) || (pos.x >= this.width && pos.y >= 0) || (pos.x >= 0 && pos.y <= 0)) {
                    return 'wall';
                }
                if (pos.x >= 0 && pos.y >= this.height) {
                    return 'lava';
                }
            }
        } else {
            throw new Error();
        }
    }

    removeActor(actor) {
        let i = 0;
        for (let elem of this.actors) {
            if (actor === elem) {
                this.actors.splice(i,1);
            }
            i++;
        }
    }

    noMoreActors(type) {
        for (let elem of this.actors) {
            if (elem.type === type) {
                return false;
            }
        }
        return true;
    }

    playerTouched(type, obj) {
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
    constructor(dictionary) {
        this.dictionary = dictionary;
    }

    actorFromSymbol(symbol) {
        for (let key in this.dictionary) {
            if (key === symbol) {
                return this.dictionary[key];
            }
        }
        return undefined;
    }

    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        }
        return undefined;
    }

    createGrid(arrString) {
        let arr = [];
        let bigArr = [];
        let i = 0;
        if (arrString.length != 0) {
            for (let key of arrString) {
                for (let symbol of key) {
                    arr.push(this.obstacleFromSymbol(symbol));
                }
                bigArr[i] = arr;
                arr = [];
                i++;
            }
            return bigArr;
        }
        return [];
    }

    createActors(arrString) {
        let arr = [];
        let i = 0;
        let j = 0;
        if (arrString.length != 0 && this.dictionary !== undefined) {
            for (let key of arrString) {

                for (let obj of key) {
                    if (obj in this.dictionary) {
                     if (Actor.isPrototypeOf(this.dictionary[obj]) || this.dictionary[obj] === Actor) {
                        arr.push(new this.dictionary[obj](new Vector(i, j)));
                     }
                    }
                    i++;
                }
                i = 0;
                j++;
            }
            return arr;
        }
        return [];
    }

    parse(arrString) {
        return new Level(this.createGrid(arrString), this.createActors(arrString));
    }
}

class Fireball extends Actor {
    constructor(pos, speed) {
        super(pos, false, speed);
        this.type;
    }

    get type() {
        return "fireball";
    }

    getNextPosition(time) {
        if (!time) {
            time = 1;
        }
        return this.pos.plus(new Vector(this.speed.x * time, this.speed.y * time));
    }

    handleObstacle() {
        this.speed.x = this.speed.x * -1;
        this.speed.y = this.speed.y * -1;
    }

    act(time, level) {
        let newPosition = this.getNextPosition(time);
        if (level.obstacleAt(newPosition, this.size) === undefined) {
            this.pos = newPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed.x = 2;
    }
}

class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed.y = 2;
    }
}

class FireRain extends Fireball {
    constructor(pos) {
        super(pos);
        this.speed.y = 3;
        this.basePos = pos;
    }

    handleObstacle() {
        this.speed.x = this.speed.x;
        this.speed.y = this.speed.y;
        this.pos.x = this.basePos.x;
        this.pos.y = this.basePos.y;
    }
}

class Coin extends Actor {
    constructor(pos) {
        super(pos);
        this.size.x = 0.6;
        this.size.y = 0.6;
        this.pos = this.pos.plus(new Vector(0.2,0.1));
        this.type;
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
        this.basePos = this.pos;
    }

    get type() {
        return "coin";
    }

    updateSpring(time) {
        if (!time) {
            time = 1;
        }
        this.spring = this.spring + this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(time) {
        if (!time) {
            time = 1;
        }
        this.updateSpring(time);
        let newVector = this.basePos.plus(this.getSpringVector());
        return newVector;
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos);
        this.pos = this.pos.plus(new Vector(0,-0.5));
        this.size.x = 0.8;
        this.size.y = 1.5;
        this.speed.x = 0;
        this.speed.y = 0;
        this.type;
    }

    get type() {
        return "player";
    }
}
/*
const schema = [
    '         ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
];
const actorDict = {
    '@': Player,
    '=': HorizontalFireball
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay)
    .then(status => console.log(`Игрок ${status}`));*/