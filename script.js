let canvas = document.getElementById('tetris')
let context = canvas.getContext('2d')

const BlockForms = {
    1:[[1],[1],[1],[1]],

    2:[[1,1,0],
      [0,1,1]],

    3:[[0,1,1],
      [1,1,0]], 

    4:[[1,0],
      [1,0],
      [1,1]],
    
    5:[[0,1],
      [0,1],
      [1,1]],

    0:[[1,1],
      [1,1]]
}

const BlockColors = {
    1:'red',
    2:'blue',
    3:'yellow',
    4:'grey',
    5:'aqua',
    0:'green'
}

const Events = {
    'new_block':'new block',
    'rotate':'rotate',
    'down':'down',
    'right':'right',
    'left':'left'
}

class Field{
    constructor({x,y}){
        this.width = x
        this.height = y
        this.size = 18  
        this.map = Array.from(Array(y), () => new Array(x))
        this.current_block_loc = Array.from(Array(4), () => new Array(2))
    }

    update(event){
        let new_cords = []
        switch(event){
            case Events['new_block']: 
                let [color, form] = this.get_random_block()
                this.color = color
                let form_height = form.length 
                let form_width = form[0].length

                for (let i = 0; i < form.length; i++) {
                    for (let j = 0; j < form[i].length; j++){
                        if (form[i][j]==1){
                            new_cords.push([i,Math.floor((this.width-form_width)/2)+j])
                        }
                    }
                }

                if (this.check_new_cords(new_cords)){
                    this.current_block_loc = new_cords
                }else{
                    return false
                }

                return true

            case Events['down']:
                for (let i = 0; i < this.current_block_loc.length; i++) {
                    new_cords.push([this.current_block_loc[i][0]+1,this.current_block_loc[i][1]])
                }
                if (this.check_new_cords(new_cords)){
                    this.current_block_loc = new_cords
                }else{
                    let points = this.add_to_map()
                    let res = this.update(Events['new_block'])
                    this.draw()
                    return [points, res]
                }
                
                this.draw()
                return [0, true] 
            
            case Events['right']:
                for (let i = 0; i < this.current_block_loc.length; i++) {
                    new_cords.push([this.current_block_loc[i][0],this.current_block_loc[i][1]+1])
                }

                if (this.check_new_cords(new_cords)){
                    this.current_block_loc = new_cords
                    this.draw()
                }

                break

            case Events['left']:
                for (let i = 0; i < this.current_block_loc.length; i++) {
                    new_cords.push([this.current_block_loc[i][0],this.current_block_loc[i][1]-1])
                }

                if (this.check_new_cords(new_cords)){
                    this.current_block_loc = new_cords
                    this.draw()
                }

                break

            case Events['rotate']:
                let y_c = this.current_block_loc.reduce((partialSum, a) => partialSum + a[0], 0)/4
                let x_c = this.current_block_loc.reduce((partialSum, a) => partialSum + a[1], 0)/4
                for (let c of this.current_block_loc){
                    new_cords.push([Math.round(y_c-(x_c-c[1])), Math.round(x_c+(y_c-c[0]))])
                }

                if (this.check_new_cords(new_cords)){
                    this.current_block_loc = new_cords
                    this.draw()
                }

                break;
        }
        
    }

    check_new_cords(cords){
        let check = ([y,x])=> y<this.height 
                              && y>=0
                              && x>=0 
                              && x<this.width
                              && this.map[y][x] == undefined
        return cords.every(check) 
    }

    add_to_map(){
        for (let [y,x] of this.current_block_loc){
            this.map[y][x] = this.color
        }

        let deleted = 0 
        let used_y = []
        
        let check_row = (row)=>{
            for (let el of row){
                if (el == undefined){
                    return false
                }
            }
            return true
        }

        let st_cs = this.current_block_loc.sort((a,b)=>a[0]-b[0])
        for (let [y,x] of st_cs){
            if (!used_y.includes(y) && check_row(this.map[y])){
                this.map.splice(y,1)
                this.map.unshift(new Array(this.width))
                used_y.push(y)
                deleted += 1 
            }
        }
        return deleted*100
    }

    get_random_block(){
        let ran = Math.floor(Math.random() * Object.keys(BlockForms).length);
        return [BlockColors[ran], BlockForms[ran]]
    }

    draw(){
        let new_map = this.map.map(function(arr) {
            return arr.slice();
        });

        for (let [y,x] of this.current_block_loc){
            new_map[y][x]=this.color
        }

        for(let x = 0; x < this.width; x += 1) {
          for(let y = 0; y < this.height; y +=1 ) {
            this.drawTile(x, y, new_map[y][x] || 'black');
          }
        }    

      }
    
      // Draw a single tile (using canvas primitives)
    drawTile(x, y, color){
        context.fillStyle = color;
        context.fillRect(
        x * this.size,  // x tiles to the right
        y * this.size,  // y tiles down
        this.size - 1,  // almost as wide as a tile
        this.size - 1); // almost as tall
    }
}

class Game{
    constructor(){
        this.score = 0
        this.field = new Field({x:12,y:20})

        this.func = (e)  => { this.user_input(e) }
        this.ev_lis = addEventListener('keydown', this.func )
        this.int_id = setInterval(()=>game.update(), 1000)

        this.start()
        this.update_score(0)
    }

    start(){
        this.field.update(Events['new_block'])
    }

    update(){
        let res = this.field.update(Events['down'])
        this.handle_update_res(res)
    }

    stop(){
        clearInterval(this.int_id)
        removeEventListener('keydown', this.func )
    }

    user_input(e){
        const arrows = { left: 37, up: 38, right: 39, down: 40};
        const actions = {
            [arrows.left]:  Events['left'],
            [arrows.up]:    Events['rotate'],
            [arrows.right]: Events['right'],
            [arrows.down]:  Events['down']
        }
        if (actions[e.keyCode] !== undefined){ 
            let res = this.field.update(actions[e.keyCode])
            this.handle_update_res(res)
        }
    }
    handle_update_res(res){
        if(res == undefined){
            return
        }
        if (res[0]!=0){
            this.update_score(res[0])
        }
        if (!res[1]){
            this.stop()
        }
    }
    update_score(new_points){
        if(new_points == undefined){
            return
        }
        this.score+=new_points
        document.getElementById("score").innerHTML = 'score: ' + this.score
    }
}


let game = new Game()

document.getElementById("start_button").addEventListener('click', (e)=>{
    game.stop()
    game = new Game()
})



