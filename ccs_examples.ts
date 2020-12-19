
type Color = [number, number, number];

class Colors
{
    static readonly WHITE: Color = [255, 255, 255];
    static readonly BLACK: Color = [0,   0,   0  ];

    static readonly RED:   Color = [255, 0,   0  ];
    static readonly GREEN: Color = [0,   255, 0  ];
    static readonly BLUE:  Color = [0,   0,   255];

    static readonly MAGENTA: Color  = [255,   0,   255];
    static readonly CYAN:    Color  = [0,     255, 255];
    static readonly YELLOW:  Color  = [255,   255, 0  ];

    static ToCSS(c: Color)
    {
        return "#"+c[0].toString(16).padStart(2, '0')
                  +c[1].toString(16).padStart(2, '0')
                  +c[2].toString(16).padStart(2, '0');
    }

    static dummy_context: CanvasRenderingContext2D|null = null;

    // https://stackoverflow.com/a/19366389
    static Parse(col: string): Color|null
    {
        if (Colors.dummy_context === null)
        {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            Colors.dummy_context = canvas.getContext('2d');
        }

        const ctx = Colors.dummy_context!;

        ctx.clearRect(0, 0, 1, 1);
        // In order to detect invalid values,
        // we can't rely on col being in the same format as what fillStyle is computed as,
        // but we can ask it to implicitly compute a normalized value twice and compare.
        ctx.fillStyle = '#000';
        ctx.fillStyle = col;
        const computed = ctx.fillStyle;
        ctx.fillStyle = '#fff';
        ctx.fillStyle = col;
        if (computed !== ctx.fillStyle) return null; // invalid color
        ctx.fillRect(0, 0, 1, 1);

        const d = [...ctx.getImageData(0, 0, 1, 1).data];
        return [ d[0], d[1], d[2] ];
    }

    static Mix(c1: Color, c2: Color, factor: number): Color {
        return [
            Math.floor(c1[0] * (1-factor) + c2[0] * factor),
            Math.floor(c1[1] * (1-factor) + c2[1] * factor),
            Math.floor(c1[2] * (1-factor) + c2[2] * factor),
        ];
    }
}

class GameOfLife
{
    static random(colorOn: Color, colorOff: Color): GameOfLife
    {
        const strColorOn  = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);

        function init(x:number, y:number, initial:boolean): boolean
        {
            if (!initial) return false;
            return Math.random()>0.5;
        }

        function step(context: CanvasCellSimContext<boolean>): boolean
        {
            const n = context.countMooreNeighborsWrapped((v) => v);

            if (context.value)
            {
                if (n < 2 || n > 3) { context.value = false; return true; }
            }
            else
            {
                if (n === 3) { context.value = true; return true; }
            }
            return false;
        }

        function apply(src: boolean, _: boolean): boolean
        {
            return src;
        }

        function color(cell: boolean): string
        {
            return cell ? strColorOn : strColorOff;
        }

        return new CCSAutomata<boolean>(init, step, apply, color)
    }

    static empty(colorOn: Color, colorOff: Color): GameOfLife
    {
        const strColorOn  = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);

        function init(x:number, y:number, initial:boolean): boolean
        {
            return false;
        }

        function step(context: CanvasCellSimContext<boolean>): boolean
        {
            const n = context.countMooreNeighborsWrapped((v) => v);

            if (context.value)
            {
                if (n < 2 || n > 3) { context.value = false; return true; }
            }
            else
            {
                if (n === 3) { context.value = true; return true; }
            }
            return false;
        }

        function apply(src: boolean, _: boolean): boolean
        {
            return src;
        }

        function color(cell: boolean): string
        {
            return cell ? strColorOn : strColorOff;
        }

        return new CCSAutomata<boolean>(init, step, apply, color)
    }

    static pentomino(colorOn: Color, colorOff: Color): GameOfLife
    {
        const strColorOn  = Colors.ToCSS(colorOn);
        const strColorOff = Colors.ToCSS(colorOff);

        function init(x:number, y:number, initial:boolean): boolean
        {
            if (!initial) return false;

            if (x ===  0 && y ===  0) return true;
            if (x ===  0 && y === -1) return true;
            if (x ===  0 && y === +1) return true;
            if (x === +1 && y ===  0) return true;
            if (x === -1 && y === -1) return true;

            return false;
        }

        function step(context: CanvasCellSimContext<boolean>): boolean
        {
            const n = context.countMooreNeighborsWrapped((v) => v);

            if (context.value)
            {
                if (n < 2 || n > 3) { context.value = false; return true; }
            }
            else
            {
                if (n === 3) { context.value = true; return true; }
            }
            return false;
        }

        function apply(src: boolean, _: boolean): boolean
        {
            return src;
        }

        function color(cell: boolean): string
        {
            return cell ? strColorOn : strColorOff;
        }

        return new CCSAutomata<boolean>(init, step, apply, color)
    }
}

class ForestFire
{
    static new(colorTree: Color, colorFire: Color, colorBackground: Color): ForestFire
    {
        return ForestFire.custom(colorTree, colorFire, colorBackground, 0.000025, 0.01);
    }

    static custom(colTree: Color, colFire: Color, colBackground: Color, chanceIgnite: number, chanceGrow: number): ForestFire
    {
        let colors: string[] = [];
        colors.push(Colors.ToCSS(colBackground));

        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 1/3)));
        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 2/3)));
        colors.push(Colors.ToCSS(Colors.Mix(colBackground, colTree, 3/3)));

        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 9/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 8/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 7/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 6/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 5/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 4/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 3/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 2/9)));
        colors.push(Colors.ToCSS(Colors.Mix(colFire, colBackground, 1/9)));

        function init(x:number, y:number, initial:boolean): number
        {
            return 0;
        }

        function step(context: CanvasCellSimContext<number>): boolean
        {
            if (context.value === 0) // empty
            {
                if (Math.random() < chanceGrow) { context.value = 1; return true; }
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
                if (anyfire) { context.value = 9; return true; }

                if (Math.random() < chanceIgnite) { context.value = 12; return true; }

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

        function apply(src: number, _: number): number
        {
            return src;
        }

        function color(cell: number): string
        {
            return colors[cell];
        }

        return new CCSAutomata<number>(init, step, apply, color)
    }
}

class Cyclic
{
    static new(): Cyclic
    {
        let colors: string[] = [
            Colors.ToCSS(Colors.Parse('rgba(255,0,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,96,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,191,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(223,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(128,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(32,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,64,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,159,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,159,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,64,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(32,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(127,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(223,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,0,191,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,0,96,1)')!),
        ];

        function init(x:number, y:number, initial:boolean): number
        {
            return Math.floor(Math.random()*16);
        }

        function step(context: CanvasCellSimContext<number>): boolean
        {
            const next = (context.value + 1) % 16;
            if (context.anyMooreNeighborsClamped((c) => c === next)) { context.value = next; return true; }
            return false;
        }

        function apply(src: number, _: number): number
        {
            return src;
        }

        function color(cell: number): string
        {
            return colors[cell];
        }

        return new CCSAutomata<number>(init, step, apply, color)
    }
}

class Cyclic2
{
    static new(): Cyclic
    {
        let colors: string[] = [
            Colors.ToCSS(Colors.Parse('rgba(255,0,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,96,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,191,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(223,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(128,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(32,255,0,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,64,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,159,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,255,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,159,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(0,64,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(32,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(127,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(223,0,255,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,0,191,1)')!),
            Colors.ToCSS(Colors.Parse('rgba(255,0,96,1)')!),
        ];

        function init(x:number, y:number, initial:boolean): number
        {
            return Math.floor(Math.random()*16);
        }

        function step(context: CanvasCellSimContext<number>): boolean
        {
            const next = (context.value + Math.floor(Math.random()*2)) % 16;
            if (context.anyMooreNeighborsClamped((c) => c === next)) { context.value = next; return true; }
            return false;
        }

        function apply(src: number, _: number): number
        {
            return src;
        }

        function color(cell: number): string
        {
            return colors[cell];
        }

        return new CCSAutomata<number>(init, step, apply, color)
    }
}

class SpidersAndMosquitoes
{
    static new(colSpiders: Color, colMosquitoes: Color, colHumans: Color): Cyclic
    {
        const strColSpiders    = Colors.ToCSS(colSpiders);
        const strColMosquitoes = Colors.ToCSS(colMosquitoes);
        const strColHumans     = Colors.ToCSS(colHumans);

        let colors = [strColHumans, strColMosquitoes, strColSpiders];

        const preybirth = 0.3;
        const preydeath = 0.1;
        const preddeath = 0.1;
        const predbirth = 0.1;

        function init(x:number, y:number, initial:boolean): number
        {
            return Math.floor(Math.random()*3);
        }

        function step(context: CanvasCellSimContext<number>): boolean
        {
            const numpred = context.countMooreNeighborsWrapped((c) => c === 2);
            const numprey = context.countMooreNeighborsWrapped((c) => c === 1);

            if (context.value === 0)
            {
                if(Math.random() < preybirth*numprey) { context.value = 1; return true; }
                return false;
            }
            else if (context.value === 1)
            {
                if(Math.random() < predbirth*numpred)  { context.value = 2; return true; }
                else if(Math.random() < preydeath)  { context.value = 0; return true; }
                return false;
            }
            else if (context.value === 2)
            {
                if(Math.random() < preddeath) { context.value = 0; return true; }
                return false;
            }

            const next = (context.value + 1) % 16;
            if (context.anyMooreNeighborsClamped((c) => c === next)) { context.value = next; return true; }
            return false;
        }

        function apply(src: number, _: number): number
        {
            return src;
        }

        function color(cell: number): string
        {
            return colors[cell];
        }

        return new CCSAutomata<number>(init, step, apply, color)
    }
}

class Caves
{
    static new(colEmpty: Color, colStone: Color): Cyclic
    {
        const strColEmpty = Colors.ToCSS(colEmpty);
        const strColStone = Colors.ToCSS(colStone);

        function init(x:number, y:number, initial:boolean): boolean
        {
            return Math.random() > 0.40;
        }

        function step(context: CanvasCellSimContext<boolean>): boolean
        {
            let nb = context.countMooreNeighborsClamped((c) => c, false);
            if (context.value)
            {
                if (nb < 4) { context.value = false; return true; }
                return false;
            }
            else
            {
                if (nb >= 6) { context.value = true; return true; }
                return false;
            }
        }

        function apply(src: boolean, _: boolean): boolean
        {
            return src;
        }

        function color(cell: boolean): string
        {
            return cell ? strColEmpty : strColStone;
        }

        return new CCSAutomata<boolean>(init, step, apply, color)
    }
}
