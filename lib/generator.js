import Literals from "./util.js";

class JSONIteratorWrapper {
    constructor (value) {
        if (!Array.isArray(value) && typeof(value) !== 'object')
            throw Error("Wrong type");
        this._isArray = Array.isArray(value);
        this._iterator = Object.entries(value)[Symbol.iterator]();
    }

    isArray() {
        return  this._isArray;
    }

    next() {
        return this._iterator.next();
    }
}

class JSONConstrutor {
    constructor(value){
        this._stack = [new JSONIteratorWrapper(value)];
        this.jsonString = this._stack[0].isArray() ? '[' : '{';
        this._hasPreviousClosed = false;
    }

    next(){
        if(this.isFinished())
            return;

        const last = this._stack[this._stack.length - 1];
        const {value: pair  , done} = last.next();

        // Add value separator if not last element
        if(this._hasPreviousClosed && !done){
            this.jsonString += Literals.VALUE_SEPARATOR;
            this._hasPreviousClosed = false;
        }
        this._hasPreviousClosed = true;
        //Finish object/array
        if (done){
            this.jsonString += last.isArray() ? Literals.END_ARRAY : Literals.END_OBJECT;
            this._stack = this._stack.slice(0, -1); //Try pop
            
        }else{
            const [key, value] = pair ? pair : [undefined, undefined];
            //Add key if object
            if(!last.isArray())
                this.jsonString += Literals.BEGIN_END_STRING + key + Literals.BEGIN_END_STRING + Literals.NAME_SEPARATOR;
            //Add value
            if (typeof(value) === 'string'){
                this.jsonString += Literals.BEGIN_END_STRING + value + Literals.BEGIN_END_STRING;
            }else if (typeof(value) === 'number'){
                this.jsonString += value;
            }else if (value === true){
                this.jsonString += Literals.TRUE;
            }else if (value === false){
                this.jsonString += Literals.FALSE;
            }else if (value === null){
                this.jsonString += Literals.NULL;
            }else if (Array.isArray(value)){
                this.jsonString += Literals.BEGIN_ARRAY;
                this._stack.push(new JSONIteratorWrapper(value));
                this._hasPreviousClosed = false;
                return;
            }else if (typeof(value) === 'object'){
                this.jsonString += Literals.BEGIN_OBJECT;
                this._stack.push(new JSONIteratorWrapper(value));
                this._hasPreviousClosed = false;
                return;
            }
        }
    }

    isFinished(){
        return this._stack.length === 0;
    }

    value(){
        return this.jsonString;
    }
}

export default function generate(object){
    //TODO Type check
    var construtor = new JSONConstrutor(object);
    while(!construtor.isFinished()){
        construtor.next();
    }
    return construtor.value();
}

