interface ICanvasCellSimAutomata<T>
{
    readonly fnInit:  (x:number,y:number,initial:boolean) => T;
    readonly fnStep:  (ctxt: CanvasCellSimContext<T>) => boolean; // return if _visual_ state of cell has changed
    readonly fnApply: (src: T, dst: T) => T;
    readonly fnColor: (v: T) => string;
}

class CCSAutomata<T> implements ICanvasCellSimAutomata<T>
{
    readonly fnInit:  (x:number,y:number,initial:boolean) => T;
    readonly fnStep:  (ctxt: CanvasCellSimContext<T>) => boolean; // return if _visual_ state of cell has changed
    readonly fnApply: (src: T, dst: T) => T;
    readonly fnColor: (v: T) => string;


    constructor(fnInit: (x:number,y:number,initial:boolean) => T,
                fnStep: (ctxt: CanvasCellSimContext<T>) => boolean,
                fnApply: (src: T, dst: T) => T,
                fnColor: (v: T) => string)
    {
        this.fnInit  = fnInit;
        this.fnStep  = fnStep;
        this.fnApply = fnApply;
        this.fnColor = fnColor;
    }
}

class CanvasCellSim<T>
{
    canvas: HTMLCanvasElement;
    anyDirty: boolean = true;
    allDirty: boolean = true;

    cellSize: number;
    cellBorderSize: number;

    context: CanvasCellSimContext<T>;

    automata: ICanvasCellSimAutomata<T>;

    grid: CanvasCell<T>[][]; // [backup, value]
    offsetX: number;
    offsetY: number;

    fully_init: boolean = false;

    iv_step: number = 0;
    iv_draw: number = 0;

    fps_counter: number = 0;
    fps_time: number = Date.now();
    fps_delta: number = 1;
    fps_delta_counter: number = 0;
    fps: number = 1;

    ups_counter: number = 0;
    ups_time: number = Date.now();
    ups_delta: number = 1;
    ups_delta_counter: number = 0;
    ups: number = 1;

    constructor(selector: string, cellsize: number, cellborder: number, automata: ICanvasCellSimAutomata<T>)
    {
        this.canvas = document.querySelector<HTMLCanvasElement>(selector)!;
        this.cellSize = cellsize;
        this.cellBorderSize = cellborder;

        this.automata  = automata;

        this.grid = [[this.initCell(0,0, true)]];

        this.context = new CanvasCellSimContext<T>(this, this.grid[0][0].value);

        this.offsetX = 0;
        this.offsetY = 0;
    }

    initCell(x:number, y:number, initial:boolean): CanvasCell<T>
    {
        let c1 = this.automata.fnInit(x, y, initial);
        let c2 = this.automata.fnInit(x, y, initial);
        c2 = this.automata.fnApply(c1, c2);

        return new CanvasCell<T>(x, y, c1, c2, this.automata.fnApply);
    }

    tryInit()
    {
        if (!this.fully_init)
        {
            this.fixGridSizeX(!this.fully_init);
            this.fixGridSizeY(!this.fully_init);
            this.fully_init = true;
        }
    }

    set(x: number, y:number, value:T): boolean
    {
        this.tryInit();

        let rx = x + this.offsetX;
        let ry = y + this.offsetY;

        if (rx < 0 || ry < 0 || rx >= this.offsetX || ry >= this.offsetY) return false;

        this.grid[ry][rx].value = value;
        return true;
    }

    step()
    {
        this.fixGridSizeX(!this.fully_init);
        this.fixGridSizeY(!this.fully_init);
        this.fully_init = true;

        let width  = this.grid[0].length;
        let height = this.grid.length;

        for (let gy = 0; gy < height; gy++) for (let gx = 0; gx < width; gx++) this.grid[gy][gx].backup();

        this.context.gridWidth  = width;
        this.context.gridHeight = height;

        for (let gy = 0; gy < height; gy++)
        {
            for (let gx = 0; gx < width; gx++)
            {
                this.context.x     = gx - this.offsetX;
                this.context.y     = gy - this.offsetY;
                this.context.value = this.grid[gy][gx].value;

                let changed = this.automata.fnStep(this.context);
                this.grid[gy][gx].value = this.context.value;
                if (changed) this.anyDirty = this.grid[gy][gx].dirty = true;
            }
        }
    }

    fixGridSizeX(initial:boolean)
    {
        const curr = this.grid[0].length;
        const calc = Math.ceil(((this.canvas.clientWidth / this.cellSize)-1)/2)*2 + 1 + 2*this.cellBorderSize;

        if (this.canvas.width !== this.canvas.getBoundingClientRect().width)
        {
            this.canvas.width = this.canvas.getBoundingClientRect().width;
            this.anyDirty = this.allDirty = true;
        }

        if (curr === calc) return;

        if (calc > curr)
        {
            let inc = (calc-curr)/2;
            for (let y = 0; y < this.grid.length; y++)
            {
                for (let i=0; i<inc;i++)
                {
                    this.grid[y].unshift(this.initCell(-(this.offsetX + i + 1), y, initial));
                    this.grid[y].push(this.initCell(+(this.offsetX + i + 1), y, initial));
                }
            }
            this.offsetX += inc;
        }
        else
        {
            let inc = (curr-calc)/2;
            for (let y = 0; y < this.grid.length; y++)
            {
                for (let i=0; i<inc;i++)
                {
                    this.grid[y].pop();
                    this.grid[y].shift();
                }
            }
            this.offsetX -= inc;
        }
    }

    fixGridSizeY(initial:boolean)
    {
        const curr = this.grid.length;
        const calc = Math.ceil(((this.canvas.clientHeight / this.cellSize)-1)/2)*2 + 1 + 2*this.cellBorderSize;

        if (this.canvas.height !== this.canvas.getBoundingClientRect().height)
        {
            this.canvas.height = this.canvas.getBoundingClientRect().height;
            this.anyDirty = this.allDirty = true;
        }

        if (curr === calc) return;

        if (calc > curr)
        {
            let inc = (calc-curr)/2;
            for (let i=0; i<inc;i++)
            {
                let nN = [];
                for (let x = 0; x < this.grid[0].length; x++) nN.push(this.initCell(x-this.offsetX, -(this.offsetY + i + 1), initial));
                this.grid.unshift(nN);

                let nS = [];
                for (let x = 0; x < this.grid[0].length; x++) nS.push(this.initCell(x-this.offsetX, +(this.offsetY + i + 1), initial));
                this.grid.push(nS);
            }
            this.offsetY += inc;
        }
        else
        {
            let inc = (curr-calc)/2;
            for (let i=0; i<inc;i++)
            {
                this.grid.pop();
                this.grid.shift();
            }
            this.offsetY -= inc;
        }
    }

    draw()
    {
        if (!this.anyDirty) return;

        let width  = this.grid[0].length;
        let height = this.grid.length;

        let canvasWidth = this.canvas.clientWidth;
        let canvasHeight = this.canvas.clientHeight;

        const ctx = this.canvas.getContext('2d', {alpha: false})!;
        for (let gy = 0; gy < height; gy++)
        {
            for (let gx = 0; gx < width; gx++)
            {
                const cx = Math.floor(canvasWidth/2)  + (gx-this.offsetX)*this.cellSize - this.cellSize/2;
                const cy = Math.floor(canvasHeight/2) + (gy-this.offsetY)*this.cellSize - this.cellSize/2;

                if (this.grid[gy][gx].dirty || this.allDirty)
                {
                    this.grid[gy][gx].dirty = false;

                    ctx.fillStyle = this.automata.fnColor(this.grid[gy][gx].value);
                    ctx.fillRect(cx, cy, this.cellSize, this.cellSize);
                }
            }
        }

        this.allDirty = this.anyDirty = false;
    }

    startStepping(interval: number)
    {
        this.tryInit();

        clearInterval(this.iv_step);
        this.iv_step = setInterval(() =>
        {

            const t0 = Date.now();
            this.step();
            this.ups_delta_counter += (Date.now()-t0);

            this.ups_counter++;
            if (this.ups_counter > 16)
            {
                const delta = Date.now() - this.ups_time;
                this.ups = this.ups_counter*1000/delta;
                this.ups_delta = this.ups_delta_counter / this.ups_counter;

                this.ups_time = Date.now();
                this.ups_counter = 0;
                this.ups_delta_counter = 0;
            }

        }, interval);
    }

    startDrawing()
    {
        this.iv_draw += 1;

        const magic = this.iv_draw;
        const fn = () =>
        {
            if (magic != this.iv_draw) return;

            const t0 = Date.now();
            this.draw();
            this.fps_delta_counter += (Date.now()-t0);

            this.fps_counter++;
            if (this.fps_counter > 16)
            {
                const delta = Date.now() - this.fps_time;
                this.fps = this.fps_counter*1000/delta;
                this.fps_delta = this.fps_delta_counter / this.fps_counter;

                this.fps_time = Date.now();
                this.fps_counter = 0;
                this.fps_delta_counter = 0;

                //console.log("FPS: " + this.fps + " (possible: " + (1000/this.fps_delta) + ")    |    UPS: " + this.ups + " (possible: " + (1000/this.ups_delta) + ")");
            }

            requestAnimationFrame(fn);
        };

        requestAnimationFrame(fn);
    }
}

class CanvasCell<T>
{
    readonly x: number;
    readonly y: number;

    value_backup: T;
    value: T;

    fnApply: (src: T, dst: T) => T;
    dirty: boolean = true;

    constructor(x: number, y:number, cell: T, cellbackup: T,
                fnApply: (src: T, dst: T) => T)
    {
        this.x = x;
        this.y = y;

        this.value        = cell;
        this.value_backup = cellbackup;

        this.fnApply = fnApply;
    }

    backup()
    {
        this.value_backup = this.fnApply(this.value, this.value_backup);
    }
}

class CanvasCellSimContext<T>
{
    readonly sim: CanvasCellSim<T>;

    gridWidth: number = 0;
    gridHeight: number = 0;

    x: number = 0;
    y: number = 0;

    value: T;

    constructor(s: CanvasCellSim<T>, dummy: T)
    {
        this.sim = s;
        this.value = dummy;
    }

    getRelativeWrapped(dx: number, dy: number): T
    {
        let gx = ((this.x + this.sim.offsetX + dx) % this.gridWidth + this.gridWidth) % this.gridWidth;
        let gy = ((this.y + this.sim.offsetY + dy) % this.gridHeight + this.gridHeight) % this.gridHeight;

        return this.sim.grid[gy][gx].value_backup;
    }

    getRelativeClamped(dx: number, dy: number, def: T): T
    {
        let gx = this.x + this.sim.offsetX + dx;
        let gy = this.y + this.sim.offsetY + dy;

        if (gx<0 || gy<0 || gx >= this.gridWidth || gy >= this.gridHeight) return def;

        return this.sim.grid[gy][gx].value_backup;
    }

    getRelativeNullable(dx: number, dy: number): T|null
    {
        let gx = this.x + this.sim.offsetX + dx;
        let gy = this.y + this.sim.offsetY + dy;

        if (gx<0 || gy<0 || gx >= this.gridWidth || gy >= this.gridHeight) return null;

        return this.sim.grid[gy][gx].value_backup;
    }

    countMooreNeighborsWrapped(fn: (cell:T)=>boolean): number
    {
        let c = 0;

        if (fn(this.getRelativeWrapped(-1,-1))) c++;
        if (fn(this.getRelativeWrapped( 0,-1))) c++;
        if (fn(this.getRelativeWrapped(+1,-1))) c++;
        if (fn(this.getRelativeWrapped(+1, 0))) c++;
        if (fn(this.getRelativeWrapped(+1,+1))) c++;
        if (fn(this.getRelativeWrapped( 0,+1))) c++;
        if (fn(this.getRelativeWrapped(-1,+1))) c++;
        if (fn(this.getRelativeWrapped(-1, 0))) c++;

        return c;
    }

    countNeumannNeighborsWrapped(fn: (cell:T)=>boolean): number
    {
        let c = 0;

        if (fn(this.getRelativeWrapped( 0,-1))) c++;
        if (fn(this.getRelativeWrapped(+1, 0))) c++;
        if (fn(this.getRelativeWrapped( 0,+1))) c++;
        if (fn(this.getRelativeWrapped(-1, 0))) c++;

        return c;
    }

    countMooreNeighborsClamped(fn: (cell:T)=>boolean, def: T): number
    {
        let c = 0;

        if (fn(this.getRelativeClamped(-1,-1, def))) c++;
        if (fn(this.getRelativeClamped( 0,-1, def))) c++;
        if (fn(this.getRelativeClamped(+1,-1, def))) c++;
        if (fn(this.getRelativeClamped(+1, 0, def))) c++;
        if (fn(this.getRelativeClamped(+1,+1, def))) c++;
        if (fn(this.getRelativeClamped( 0,+1, def))) c++;
        if (fn(this.getRelativeClamped(-1,+1, def))) c++;
        if (fn(this.getRelativeClamped(-1, 0, def))) c++;

        return c;
    }

    countNeumannNeighborsClamped(fn: (cell:T)=>boolean, def: T): number
    {
        let c = 0;

        if (fn(this.getRelativeClamped( 0,-1, def))) c++;
        if (fn(this.getRelativeClamped(+1, 0, def))) c++;
        if (fn(this.getRelativeClamped( 0,+1, def))) c++;
        if (fn(this.getRelativeClamped(-1, 0, def))) c++;

        return c;
    }

    anyMooreNeighborsWrapped(fn: (cell:T)=>boolean): boolean
    {
        if (fn(this.getRelativeWrapped(-1,-1))) return true;
        if (fn(this.getRelativeWrapped( 0,-1))) return true;
        if (fn(this.getRelativeWrapped(+1,-1))) return true;
        if (fn(this.getRelativeWrapped(+1, 0))) return true;
        if (fn(this.getRelativeWrapped(+1,+1))) return true;
        if (fn(this.getRelativeWrapped( 0,+1))) return true;
        if (fn(this.getRelativeWrapped(-1,+1))) return true;
        if (fn(this.getRelativeWrapped(-1, 0))) return true;

        return false;
    }

    anyNeumannNeighborsWrapped(fn: (cell:T)=>boolean): boolean
    {
        if (fn(this.getRelativeWrapped( 0,-1))) return true;
        if (fn(this.getRelativeWrapped(+1, 0))) return true;
        if (fn(this.getRelativeWrapped( 0,+1))) return true;
        if (fn(this.getRelativeWrapped(-1, 0))) return true;

        return false;
    }

    anyMooreNeighborsClamped(fn: (cell:T)=>boolean): boolean
    {
        let v: T|null;

        if ((v = this.getRelativeNullable(-1,-1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(-1,-1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable( 0,-1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(+1,-1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(+1, 0)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(+1,+1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable( 0,+1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(-1,+1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(-1, 0)) != null && fn(v)) return true;

        return false;
    }

    anyNeumannNeighborsClamped(fn: (cell:T)=>boolean): boolean
    {
        let v: T|null;

        if ((v = this.getRelativeNullable( 0,-1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(+1, 0)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable( 0,+1)) != null && fn(v)) return true;
        if ((v = this.getRelativeNullable(-1, 0)) != null && fn(v)) return true;

        return false
    }

}