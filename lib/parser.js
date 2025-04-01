import Literals from './util.js'

const Tokens = {
    BEGIN_ARRAY_SEPARATOR : 0,
    BEGIN_OBJECT_SEPARATOR : 1,
    END_ARRAY_SEPARATOR : 2,
    END_OBJECT_SEPARATOR : 3,
    NAME_SEPARATOR : 4,
    VALUE_SEPARATOR : 5,
    NUMBER_LITERAL : 6,
    STRING_LITERAL : 7,
    TRUE_LITERAL : 8,
    FALSE_LITERAL : 9,
    NULL_LITERAL : 10
}

const EvalState = {
    EXPECT_VALUE : 0,
    EXPECT_KEY : 1,
    EXPECT_SEPERATOR : 2,
    EXPECT_VALUE_END : 3,
    EXPECT_KEY_END : 4
}

function Token(token, value = undefined){
    this.token = token;
    this.value = value;
}

export function scan(json){
    if (typeof(json) !== 'string')
        throw Error (`json is not of type string`);
    var tokens = [];
    for (let i = 0; i < json.length; i++){
        switch(json[i]){
            case Literals.BEGIN_ARRAY:
                tokens.push(new Token(Tokens.BEGIN_ARRAY_SEPARATOR));
                break;
            case Literals.BEGIN_OBJECT:
                tokens.push(new Token(Tokens.BEGIN_OBJECT_SEPARATOR));
                break;
            case Literals.END_ARRAY:
                tokens.push(new Token(Tokens.END_ARRAY_SEPARATOR));
                break;
            case Literals.END_OBJECT:
                tokens.push(new Token(Tokens.END_OBJECT_SEPARATOR));
                break;
            case Literals.NAME_SEPARATOR:
                tokens.push(new Token(Tokens.NAME_SEPARATOR));
                break;
            case Literals.VALUE_SEPARATOR:
                tokens.push(new Token(Tokens.VALUE_SEPARATOR));
                break;
            case Literals.BEGIN_END_STRING:
                let i2 = i;
                do {
                    i++;
                    if (i > json.length - 1)
                        throw Error(`Unexpected end of string. Expected ${Literals.BEGIN_END_STRING}.`);
                    if (json[i] === Literals.ESCAPE){
                        i++;
                        if (i > json.length - 1)
                            throw Error(`Unexpected end of string. Expected ${Literals.BEGIN_END_STRING}.`);
                    }
                }while( json[i] !== Literals.BEGIN_END_STRING)
                tokens.push(new Token(Tokens.STRING_LITERAL, json.substring(i2 + 1, i)));
                break;
            case Literals.TRUE[0]:
                if(json.substring(i, i + 4) === Literals.TRUE){
                    i += 3;
                    tokens.push(new Token(Tokens.TRUE_LITERAL, true));
                }else
                    throw Error();
                break;
            case Literals.FALSE[0]:
                if (json.substring(i, i + 5) === Literals.FALSE){
                    i += 4;
                    tokens.push(new Token(Tokens.FALSE_LITERAL, false));
                }else
                    throw Error();
                break;
            case Literals.NULL[0]: 
                if (json.substring(i, i + 4) === Literals.NULL){
                    i += 3;
                    tokens.push(new Token(Tokens.NULL_LITERAL, null));
                }else
                    throw Error();
                break;
            case Literals.NEWLINE:
            case Literals.RETURN:
            case Literals.SPACE:
            case Literals.TAB:
                break;  
            default:
                if('0' <= json[i] && json[i] <= '9' || json[i] === Literals.MINUS){
                    // Find number end
                    let i2 = i;
                    do {
                        i++;
                        if (i > json.length - 1)
                            throw Error(`Unexpected end of string. Expected number.`);
                    } while ('0' <= json[i] && json[i] <= '9')
                    if (json[i] === Literals.DOT){
                        i++;
                        do {
                            i++;
                            if (i > json.length - 1)
                                throw Error(`Unexpected end of string. Expected number.`);
                        } while ('0' <= json[i] && json[i] <= '9')
                    }
                    if (json[i] === Literals.LOWEWRCASE_E || json[i] === Literals.UPPERCASE_E){
                        i++;
                        if (i > json.length - 1)
                            throw Error(`Unexpected end of string. Expected number.`);
                        if (json[i] === Literals.PLUS || json[i] === Literals.MINUS)
                            i++;
                        do {
                            i++;
                            if (i > json.length - 1)
                                throw Error(`Unexpected end of string. Expected number.`);
                        } while ('0' <= json[i] && json[i] <= '9')
                    }
                    i--;
                    tokens.push(new Token(Tokens.NUMBER_LITERAL, Number(json.substring(i2, i + 1))));
                }else {
                    throw Error (`Unexpected symbol at position ${i} with '${json[i]}'.`);
                }
        }
    }
    return tokens;
}

export function evaluate(tokens){
    var valuesArray = [];
    var keys = [];
    var state = EvalState.EXPECT_VALUE;
    for (var i = 0; i < tokens.length; i++){
        //console.log('\n');
        //console.log(state);
        //console.log(tokens[i]);
        switch(state){
            case EvalState.EXPECT_VALUE_END:
                if (tokens[i].token === Tokens.END_ARRAY_SEPARATOR)
                    state = EvalState.EXPECT_SEPERATOR;
                else 
                    state = EvalState.EXPECT_VALUE;
                i--;
                break;
            case EvalState.EXPECT_KEY_END:
                if (tokens[i].token === Tokens.END_OBJECT_SEPARATOR)
                    state = EvalState.EXPECT_SEPERATOR;
                else 
                    state = EvalState.EXPECT_KEY;
                i--;
                break;
            case EvalState.EXPECT_VALUE:
                switch (tokens[i].token){
                    case Tokens.BEGIN_ARRAY_SEPARATOR:
                        valuesArray.push([]);
                        state = EvalState.EXPECT_VALUE_END;
                        break;
                    case Tokens.BEGIN_OBJECT_SEPARATOR:
                        valuesArray.push({});
                        state = EvalState.EXPECT_KEY_END;
                        break;
                    case Tokens.NUMBER_LITERAL:
                    case Tokens.STRING_LITERAL:
                    case Tokens.TRUE_LITERAL:
                    case Tokens.FALSE_LITERAL:
                    case Tokens.NULL_LITERAL:
                        if (Array.isArray(valuesArray[valuesArray.length - 1]))
                            valuesArray[valuesArray.length - 1].push(tokens[i].value);
                        else
                            valuesArray[valuesArray.length - 1][keys.pop()] = tokens[i].value;
                        state = EvalState.EXPECT_SEPERATOR;
                        break;
                    default:
                        throw Error ('Expected value, but got wrong symbol');
                }
                break;
            case EvalState.EXPECT_KEY:
                i ++;
                if (!(i < tokens.length))
                    throw Error('Expected key, but ran out of bounds.');
                if (tokens[i - 1].token !== Tokens.STRING_LITERAL || tokens[i].token !== Tokens.NAME_SEPARATOR){
                    console.log(tokens[i - 1].token);
                    console.log(tokens[i].token);
                    throw Error ('Expected key, but got wrong symbols');
                }
                keys.push(tokens[i - 1].value);
                state = EvalState.EXPECT_VALUE;
                break;
            case EvalState.EXPECT_SEPERATOR:
                switch(tokens[i].token){
                    case Tokens.END_ARRAY_SEPARATOR:
                        if (!Array.isArray(valuesArray[valuesArray.length - 1]))
                            throw Error('Expected object end, but got array end');
                        //TODO
                        //Insert into previous value if exist
                        if (valuesArray.length < 2){
                            if (i !== tokens.length - 1)
                                throw Error('Expected ');
                            break;
                        }
                        if (Array.isArray(valuesArray[valuesArray.length - 2])){
                            valuesArray[valuesArray.length - 2].push(valuesArray[valuesArray.length - 1]);   
                        }else{
                            valuesArray[valuesArray.length - 2][keys[keys.length - 1]] = valuesArray[valuesArray.length - 1];
                            keys.pop();  
                        }
                        valuesArray.splice(-1,1);
                        break;
                    case Tokens.END_OBJECT_SEPARATOR:
                        if (Array.isArray(valuesArray[valuesArray.length - 1]))
                            throw Error('Expected array end, but got object end');
                        //TODO
                        //Insert into previous value if exist
                        if (valuesArray.length < 2){
                            if (i !== tokens.length - 1)
                                throw Error('Expected ');
                            break;
                        }
                        if (Array.isArray(valuesArray[valuesArray.length - 2])){
                            valuesArray[valuesArray.length - 2].push(valuesArray[valuesArray.length - 1]);   
                        }else{
                            valuesArray[valuesArray.length - 2][keys[keys.length - 1]] = valuesArray[valuesArray.length - 1];
                            keys.pop();  
                        }
                        valuesArray.splice(-1,1);
                        break;
                    case Tokens.VALUE_SEPARATOR:
                        if (Array.isArray(valuesArray[valuesArray.length - 1]))
                            state = EvalState.EXPECT_VALUE;
                        else
                            state = EvalState.EXPECT_KEY;
                        break; 
                }
                break;
            default:
                throw Error('Unknown state');
        }
    }
    return valuesArray[0];
}

export default function parse(json){
    const tokens = scan(json);
    return evaluate(tokens);
}
