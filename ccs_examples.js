"use strict";
class Colors {
    static ToCSS(c) {
        return "#" + c[0].toString(16).padStart(2, '0')
            + c[1].toString(16).padStart(2, '0')
            + c[2].toString(16).padStart(2, '0');
    }
    // https://stackoverflow.com/a/11068286
    static Parse(input) {
        let div = document.createElement('div');
        div.style.color = input;
        div.style.display = "hidden";
        window.document.body.appendChild(div);
        let m = getComputedStyle(div).color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        window.document.body.removeChild(div);
        if (m)
            return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        else
            throw new Error("Colour " + input + " could not be parsed.");
    }
    static Mix(c1, c2, factor) {
        return [
            Math.floor(c1[0] * (1 - factor) + c2[0] * factor),
            Math.floor(c1[1] * (1 - factor) + c2[1] * factor),
            Math.floor(c1[2] * (1 - factor) + c2[2] * factor),
        ];
    }
}
Colors.WHITE = [255, 255, 255];
Colors.BLACK = [0, 0, 0];
Colors.RED = [255, 0, 0];
Colors.GREEN = [0, 255, 0];
Colors.BLUE = [0, 0, 255];
Colors.MAGENTA = [255, 0, 255];
Colors.CYAN = [0, 255, 255];
Colors.YELLOW = [255, 255, 0];
Colors.dummy_context = null;
class GameOfLife {
    static random(colorOn, colorOff, radius) {
        const strColorOn = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);
        function init(x, y, initial) {
            if (!initial)
                return false;
            if (Math.abs(x) > radius || Math.abs(y) > radius)
                return false;
            if ((x * x + y * y) > radius * radius)
                return false;
            return Math.random() > 0.5;
        }
        function step(context) {
            const n = context.countMooreNeighborsWrapped((v) => v);
            if (context.value) {
                if (n < 2 || n > 3) {
                    context.value = false;
                    return true;
                }
            }
            else {
                if (n === 3) {
                    context.value = true;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColorOn : strColorOff;
        }
        return new CCSAutomata(init, step, apply, color);
    }
    static empty(colorOn, colorOff) {
        const strColorOn = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);
        function init(x, y, initial) {
            return false;
        }
        function step(context) {
            const n = context.countMooreNeighborsWrapped((v) => v);
            if (context.value) {
                if (n < 2 || n > 3) {
                    context.value = false;
                    return true;
                }
            }
            else {
                if (n === 3) {
                    context.value = true;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColorOn : strColorOff;
        }
        return new CCSAutomata(init, step, apply, color);
    }
    static pentomino(colorOn, colorOff) {
        const strColorOn = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);
        function init(x, y, initial) {
            if (!initial)
                return false;
            if (x === 0 && y === 0)
                return true;
            if (x === 0 && y === -1)
                return true;
            if (x === 0 && y === +1)
                return true;
            if (x === +1 && y === 0)
                return true;
            if (x === -1 && y === -1)
                return true;
            return false;
        }
        function step(context) {
            const n = context.countMooreNeighborsWrapped((v) => v);
            if (context.value) {
                if (n < 2 || n > 3) {
                    context.value = false;
                    return true;
                }
            }
            else {
                if (n === 3) {
                    context.value = true;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColorOn : strColorOff;
        }
        return new CCSAutomata(init, step, apply, color);
    }
    static random_fading(colorOn, colorOff, radius) {
        const id_on = 8;
        const colors = [
            Colors.ToCSS(colorOff),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 1 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 2 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 3 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 4 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 5 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 6 / 8)),
            Colors.ToCSS(Colors.Mix(colorOff, colorOn, 7 / 8)),
            Colors.ToCSS(colorOn),
        ];
        function init(x, y, initial) {
            if (!initial)
                return 0;
            if (Math.abs(x) > radius || Math.abs(y) > radius)
                return 0;
            if ((x * x + y * y) > radius * radius)
                return 0;
            return Math.random() > 0.5 ? id_on : 0;
        }
        function step(context) {
            const n = context.countMooreNeighborsWrapped((v) => v == id_on);
            if (context.value === id_on) {
                if (n < 2 || n > 3) {
                    context.value = id_on - 1;
                    return true;
                }
            }
            else {
                if (n === 3) {
                    context.value = id_on;
                    return true;
                }
                if (context.value > 0) {
                    context.value--;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class ForestFire {
    static new(colorTree, colorFire, colorBackground) {
        return ForestFire.custom(colorTree, colorFire, colorBackground, 0.000025, 0.01);
    }
    static custom(colTree, colFire, colBackground, chanceIgnite, chanceGrow) {
        let colors = [];
        colors.push(Colors.ToCSS(colBackground));
        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 1 / 3)));
        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 2 / 3)));
        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 3 / 3)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 9 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 8 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 7 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 6 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 5 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 4 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 3 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 2 / 9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 1 / 9)));
        function init(x, y, initial) {
            return 0;
        }
        function step(context) {
            if (context.value === 0) // empty
             {
                if (Math.random() < chanceGrow) {
                    context.value = 1;
                    return true;
                }
                return false;
            }
            else if (context.value >= 1 && context.value < 3) // growing tree
             {
                context.value += 1;
                return true;
            }
            else if (context.value == 3) // tree
             {
                const anyfire = context.anyMooreNeighborsClamped((c) => c >= 4);
                if (anyfire) {
                    context.value = 9;
                    return true;
                }
                if (Math.random() < chanceIgnite) {
                    context.value = 12;
                    return true;
                }
                return false;
            }
            else if (context.value == 4) // end of burn
             {
                context.value = 0;
                return true;
            }
            else if (context.value >= 5) // burning
             {
                context.value -= 1;
                return true;
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Cyclic {
    static new() {
        let colors = [
            Colors.ToCSS(Colors.Parse('rgba(255,0,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,96,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,191,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(223,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(128,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(32,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,64,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,159,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,159,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,64,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(32,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(127,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(223,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,0,191,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,0,96,1)')),
        ];
        function init(x, y, initial) {
            return Math.floor(Math.random() * 16);
        }
        function step(context) {
            const next = (context.value + 1) % 16;
            if (context.anyMooreNeighborsClamped((c) => c === next)) {
                context.value = next;
                return true;
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Cyclic2 {
    static colorful() {
        let colors = [
            Colors.ToCSS(Colors.Parse('rgba(255,0,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,96,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,191,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(223,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(128,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(32,255,0,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,64,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,159,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,255,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,159,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(0,64,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(32,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(127,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(223,0,255,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,0,191,1)')),
            Colors.ToCSS(Colors.Parse('rgba(255,0,96,1)')),
        ];
        return Cyclic2.new(colors);
    }
    static gradient(start, end) {
        let colors = [
            Colors.ToCSS(Colors.Mix(start, end, 0 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 1 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 2 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 3 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 4 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 5 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 4 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 3 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 2 / 5)),
            Colors.ToCSS(Colors.Mix(start, end, 1 / 5)),
        ];
        return Cyclic2.new(colors);
    }
    static new(colors) {
        function init(x, y, initial) {
            return Math.floor(Math.random() * colors.length);
        }
        function step(context) {
            const next = (context.value + Math.floor(Math.random() * 2)) % colors.length;
            if (context.anyMooreNeighborsClamped((c) => c === next)) {
                context.value = next;
                return true;
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class SpidersAndMosquitoes {
    static new(colSpiders, colMosquitoes, colHumans) {
        const strColSpiders = Colors.ToCSS(colSpiders);
        const strColMosquitoes = Colors.ToCSS(colMosquitoes);
        const strColHumans = Colors.ToCSS(colHumans);
        let colors = [strColHumans, strColMosquitoes, strColSpiders];
        const preybirth = 0.3;
        const preydeath = 0.1;
        const preddeath = 0.1;
        const predbirth = 0.1;
        function init(x, y, initial) {
            return (initial && Math.random() < 0.95) ? 0 : Math.floor(Math.random() * 3);
        }
        function step(context) {
            const numpred = context.countMooreNeighborsWrapped((c) => c === 2);
            const numprey = context.countMooreNeighborsWrapped((c) => c === 1);
            if (context.value === 0) {
                if (Math.random() < preybirth * numprey) {
                    context.value = 1;
                    return true;
                }
                return false;
            }
            else if (context.value === 1) {
                if (Math.random() < predbirth * numpred) {
                    context.value = 2;
                    return true;
                }
                else if (Math.random() < preydeath) {
                    context.value = 0;
                    return true;
                }
                return false;
            }
            else if (context.value === 2) {
                if (Math.random() < preddeath) {
                    context.value = 0;
                    return true;
                }
                return false;
            }
            const next = (context.value + 1) % 16;
            if (context.anyMooreNeighborsClamped((c) => c === next)) {
                context.value = next;
                return true;
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Caves {
    static new(colEmpty, colStone) {
        const strColEmpty = Colors.ToCSS(colEmpty);
        const strColStone = Colors.ToCSS(colStone);
        function init(x, y, initial) {
            return Math.random() > 0.40;
        }
        function step(context) {
            let nb = context.countMooreNeighborsClamped((c) => c, false);
            if (context.value) {
                if (nb < 4) {
                    context.value = false;
                    return true;
                }
                return false;
            }
            else {
                if (nb >= 6) {
                    context.value = true;
                    return true;
                }
                return false;
            }
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColEmpty : strColStone;
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Maze {
    static new(colEmpty, colStone) {
        const strColEmpty = Colors.ToCSS(colEmpty);
        const strColStone = Colors.ToCSS(colStone);
        function init(x, y, initial) {
            if (initial && Math.abs(x) < 12 && Math.abs(y) < 12)
                return Math.random() > 0.5;
            return false;
        }
        function step(context) {
            const n = context.countMooreNeighborsClamped((v) => v, false);
            if (context.value) {
                if (n == 0 || n > 5) {
                    context.value = false;
                    return true;
                }
            }
            else {
                if (n === 3) {
                    context.value = true;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColEmpty : strColStone;
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Seed {
    static new(colEmpty, colStone) {
        const strColEmpty = Colors.ToCSS(colEmpty);
        const strColStone = Colors.ToCSS(colStone);
        function init(x, y, initial) {
            if (initial && Math.abs(x) < 3 && Math.abs(y) < 3)
                return Math.random() > 0.5;
            return false;
        }
        function step(context) {
            if (context.value) {
                context.value = false;
                return true;
            }
            else {
                const n = context.countMooreNeighborsClamped((v) => v, false);
                if (n === 2) {
                    context.value = true;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strColEmpty : strColStone;
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class Seed2 {
    static new(colOn, colDead) {
        let colors = [
            Colors.ToCSS(colDead),
            Colors.ToCSS(Colors.Mix(colDead, colOn, 1 / 4)),
            Colors.ToCSS(Colors.Mix(colDead, colOn, 2 / 4)),
            Colors.ToCSS(Colors.Mix(colDead, colOn, 3 / 4)),
            Colors.ToCSS(colOn)
        ];
        function init(x, y, initial) {
            if (initial && Math.abs(x) < 3 && Math.abs(y) < 3)
                return Math.random() > 0.5 ? 4 : 0;
            return 0;
        }
        function step(context) {
            if (context.value === 4) {
                context.value = 3;
                return true;
            }
            else if (context.value === 3 || context.value === 2 || context.value === 1) {
                const n = context.countMooreNeighborsClamped((v) => v == 4, 0);
                if (n === 2) {
                    context.value = 4;
                    return true;
                }
                context.value = context.value - 1;
                return true;
            }
            else if (context.value === 0) {
                const n = context.countMooreNeighborsClamped((v) => v == 4, 0);
                if (n === 2) {
                    context.value = 4;
                    return true;
                }
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return colors[cell];
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
class LifeLike {
    static fromRuleString(ruleString, moore, wrap, random, colOff, colOn) {
        let [b, s] = ruleString.split("/");
        if (!b.startsWith("B"))
            throw "Invalid rulestring";
        if (!s.startsWith("S"))
            throw "Invalid rulestring";
        let birth = [];
        for (let i = 1; i < b.length; i++)
            birth.push(parseInt(b[i]));
        let survive = [];
        for (let i = 1; i < s.length; i++)
            survive.push(parseInt(s[i]));
        return LifeLike.new(birth, survive, moore, wrap, random, colOff, colOn);
    }
    static fromRuleInteger(ruleInt, wrap, random, colOff, colOn) {
        let bin = (ruleInt >>> 0).toString(2).padStart(18, '0');
        let birth = [];
        let survive = [];
        if (bin[17] === '1')
            birth.push(0);
        if (bin[16] === '1')
            birth.push(1);
        if (bin[15] === '1')
            birth.push(2);
        if (bin[14] === '1')
            birth.push(3);
        if (bin[13] === '1')
            birth.push(4);
        if (bin[12] === '1')
            birth.push(5);
        if (bin[11] === '1')
            birth.push(6);
        if (bin[10] === '1')
            birth.push(7);
        if (bin[9] === '1')
            birth.push(8);
        if (bin[8] === '1')
            survive.push(0);
        if (bin[7] === '1')
            survive.push(1);
        if (bin[6] === '1')
            survive.push(2);
        if (bin[5] === '1')
            survive.push(3);
        if (bin[4] === '1')
            survive.push(4);
        if (bin[3] === '1')
            survive.push(5);
        if (bin[2] === '1')
            survive.push(6);
        if (bin[1] === '1')
            survive.push(7);
        if (bin[0] === '1')
            survive.push(8);
        return LifeLike.new(birth, survive, true, wrap, random, colOff, colOn);
    }
    static new(birth, survive, moore, wrap, random, colOff, colOn) {
        const strCol0 = Colors.ToCSS(colOff);
        const strCol1 = Colors.ToCSS(colOn);
        function init(x, y, initial) {
            if (random)
                return Math.random() < 0.5;
            return false;
        }
        function step(context) {
            if (context.value) {
                if (survive.length == 0) {
                    context.value = false;
                    return true;
                }
                if (moore && survive.length == 9)
                    return false;
                if (!moore && survive.length == 5)
                    return false;
                let n;
                if (moore) {
                    if (wrap) {
                        n = context.countMooreNeighborsWrapped((v) => v);
                    }
                    else {
                        n = context.countMooreNeighborsClamped((v) => v, false);
                    }
                }
                else {
                    if (wrap) {
                        n = context.countNeumannNeighborsWrapped((v) => v);
                    }
                    else {
                        n = context.countNeumannNeighborsClamped((v) => v, false);
                    }
                }
                if (survive.includes(n))
                    return false;
                context.value = false;
                return true;
            }
            else {
                if (birth.length == 0)
                    return false;
                if (moore && birth.length == 9) {
                    context.value = true;
                    return true;
                }
                if (!moore && birth.length == 5) {
                    context.value = true;
                    return true;
                }
                let n;
                if (moore) {
                    if (wrap) {
                        n = context.countMooreNeighborsWrapped((v) => v);
                    }
                    else {
                        n = context.countMooreNeighborsClamped((v) => v, false);
                    }
                }
                else {
                    if (wrap) {
                        n = context.countNeumannNeighborsWrapped((v) => v);
                    }
                    else {
                        n = context.countNeumannNeighborsClamped((v) => v, false);
                    }
                }
                if (birth.includes(n)) {
                    context.value = true;
                    return true;
                }
                return false;
            }
            return false;
        }
        function apply(src, _) {
            return src;
        }
        function color(cell) {
            return cell ? strCol1 : strCol0;
        }
        return new CCSAutomata(init, step, apply, color);
    }
}
