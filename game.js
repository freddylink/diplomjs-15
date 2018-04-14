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
        // лучше сначала проверить аргументы функции, а потом писать основной код
        if (actor && actor instanceof Actor) {
            if (actor === this) {
                return false;
            }
            // зачем эти рассчёты?
            let centerX = (actor.right + actor.left) / 2;
            let centerY = (actor.bottom + actor.top) / 2;
            // в таких случаях лучше писать прсто return <выражение из if>
            if (this.left < centerX && centerX < this.right && this.top < centerY && centerY < this.bottom) {
                  return true;
            }
            return false;
        }
        throw new Error('Можно передавать только объекты типа Actor');
    }

}

class Level{
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        this.player = actors.find(item => item.type === 'player');
        this.height = this.grid.length;
        this.width = 0;

        // let of редко используется, чаще просто цикл или forEach
        // в данном случае лучше использовать reduce или Math.max + map
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
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actor) {
        if (actor && actor instanceof Actor) {
            return this.actors.find(elem => actor.isIntersect(elem));
            // else не нужен, т.к. в if return
        } else {
            // проверки аргументов лучше делать в начале функции
            throw new Error('Можно передавать только объекты типа Actor и аргумент не может быть пустым');
        }
    }

    obstacleAt(pos, size) {
        if ((pos instanceof Vector) || (size instanceof Vector)) {
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

            // округлённые значение лучше записать в переменне, чтобы не округлять на каждой итерации цикла
            for (let y = Math.floor(topBorder); y < Math.ceil(bottomBorder); y++) {
                for (let x = Math.floor(leftBorder); x < Math.ceil(rightBorder); x++) {
                    const fieldType = this.grid[y][x];
                    if (fieldType) {
                        return fieldType;
                    }
                }
            }
        } else {
            // проверки аргументов лучше делать в начале функции
            throw new Error('Можно передавать только объекты типа Vector');
        }
    }

    removeActor(actor) {
        // если заменить на цикл код станет проще
        let i = 0;
        for (let elem of this.actors) {
            if (actor === elem) {
                this.actors.splice(i,1);
                // тут можно добавить return чтобы остановить перебор элементов когда нужный уже удалён
            }
            i++;
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
    // здесь можно добавить значение по-умолчанию
    constructor(dictionary) {
        // тут лучше создать копию объекта, чтобы поле нельзя было изменить извне
        this.dictionary = dictionary;
    }

    actorFromSymbol(symbol) {
        // проверка лишняя
        if (!symbol) {
            return undefined;
        }
        return this.dictionary[symbol];
    }

    obstacleFromSymbol(symbol) {
        if (symbol === 'x') {
            return 'wall';
        }
        if (symbol === '!') {
            return 'lava';
        }
        // лишняя строчка, фукнция, возвращает undefined, если не указано другое
        return undefined;
    }

    createGrid(arrString) {
        // значение присваивается переменной один раз, поэтому лучше использовать const
        let arr = [];
        let bigArr = [];
        let i = 0;
        // более изящное решение - использовать map 2 раза
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
        // значение присваивается переменной один раз, поэтому лучше использовать const
        let arr = [];
        let i = 0;
        let j = 0;
        if (arrString.length != 0 && this.dictionary !== undefined) {
            // for let of лучше заменить простым циклом или forEach
            for (let key of arrString) {
                for (let obj of key) {
                    // тут лучше объявить несколько переменных,
                    // например чтобы не писать везде this.dictionary[obj]
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
    constructor(pos) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 3));
        this.basePos = pos;
    }

    handleObstacle() {
        this.pos = this.basePos;
    }
}

class Coin extends Actor {
    // лучше не опускать аргументы конструктора Vector - его может кто-нибудь поменять, а код сломается ваш
    constructor(pos = new Vector()) {
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
    constructor(pos = new Vector()) {
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
