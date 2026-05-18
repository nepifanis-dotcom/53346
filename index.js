import fs from 'fs';
import antlr4 from 'antlr4';
import comandoLexer from './comandoLexer.js';
import commandParser from './commandParser.js';

// --- 1. Manejador de Errores Personalizado ---
class CustomErrorListener extends antlr4.error.ErrorListener {
    constructor() {
        super();
        this.errors = [];
    }
    syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
        this.errors.push(`Línea ${line}:${column} - Error: ${msg}`);
    }
}

// --- 4. Traductor / Intérprete del Árbol ---
class CustomInterpreter {
    translate(tree) {
        return this.visit(tree);
    }

    visit(node) {
        if (!node) return '';
        const nodeType = node.constructor.name;

        switch (nodeType) {
            case 'ProgramaContext':
                const progName = node.IDENTIFICADOR().getText();
                let progBody = '';
                node.instruccion().forEach(inst => {
                    progBody += this.visit(inst);
                });
                return `// Programa: ${progName}\n${progBody}`;

            case 'InstruccionContext':
                if (node.asignacion()) return this.visit(node.asignacion()) + ';\n';
                if (node.excepcion()) return this.visit(node.excepcion()) + '\n';
                if (node.bloque()) return this.visit(node.bloque()) + '\n';
                if (node.imprimir()) return this.visit(node.imprimir()) + ';\n';
                return '';

            case 'AsignacionContext':
                const id = node.IDENTIFICADOR().getText();
                const exp = this.visit(node.expresion());
                return `let ${id} = ${exp}`;

            case 'ExcepcionContext':
                const blockTry = this.visit(node.bloque(0));
                const errorId = node.IDENTIFICADOR().getText();
                const blockCatch = this.visit(node.bloque(1));
                return `try ${blockTry} catch (${errorId}) ${blockCatch}`;

            case 'BloqueContext':
                let blockContent = '{\n';
                node.instruccion().forEach(inst => {
                    blockContent += '  ' + this.visit(inst);
                });
                blockContent += '}';
                return blockContent;

            case 'ImprimirContext':
                return `console.log(${this.visit(node.expresion())})`;

            case 'ExpresionContext':
                let exprStr = this.visit(node.termino(0));
                for (let i = 1; i < node.termino().length; i++) {
                    const op = node.children[i * 2 - 1].getText();
                    exprStr += ` ${op} ${this.visit(node.termino(i))}`;
                }
                return exprStr;

            case 'TerminoContext':
                if (node.NUMERO()) return node.NUMERO().getText();
                if (node.IDENTIFICADOR()) return node.IDENTIFICADOR().getText();
                if (node.expresion()) return `(${this.visit(node.expresion())})`;
                return '';

            default:
                return node.getText();
        }
    }
}

// --- FLUJO PRINCIPAL ---
function procesarAnalizador(archivoEntrada) {
    console.log(`==================================================`);
    console.log(` Leyendo archivo: ${archivoEntrada}`);
    console.log(`==================================================\n`);

    if (!fs.existsSync(archivoEntrada)) {
        console.error("El archivo de entrada no existe.");
        return;
    }

    const input = fs.readFileSync(archivoEntrada, 'utf-8');
    const chars = new antlr4.InputStream(input);
    const lexer = new comandoLexer(chars);
    const tokens = new antlr4.CommonTokenStream(lexer);
    const parser = new commandParser(tokens);

    const errorListener = new CustomErrorListener();
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    tokens.fill();
    
    // TAREA 2: Tabla de lexemas-tokens
    console.log("--- TAREA 2: TABLA DE LEXEMAS Y TOKENS ---");
    console.log(String("LEXEMA").padEnd(20) + " | " + String("TOKEN (TIPO)"));
    console.log("-".repeat(40));
    tokens.tokens.forEach(token => {
        if (token.type !== antlr4.Token.EOF) {
            const symbolicName = parser.symbolicNames[token.type] || token.type;
            console.log(`${token.text.padEnd(20)} | ${symbolicName}`);
        }
    });
    console.log("\n");

    const tree = parser.programa();

    // TAREA 1: Análisis Léxico y Sintáctico
    console.log("--- TAREA 1: INFORME DE ANÁLISIS LÉXICO/SINTÁCTICO ---");
    if (errorListener.errors.length === 0) {
        console.log("¡Análisis exitoso! El código no contiene errores sintácticos ni léxicos.\n");
        
        // TAREA 3: Árbol de análisis sintáctico
        console.log("--- TAREA 3: ÁRBOL DE ANÁLISIS SINTÁCTICO ---");
        console.log(tree.toStringTree(parser.ruleNames, parser));
        console.log("\n");

        // TAREA 4: Interpretación / Traducción
        console.log("--- TAREA 4: TRADUCCIÓN A JAVASCRIPT ---");
        const interpreter = new CustomInterpreter();
        const codigoJS = interpreter.translate(tree);
        console.log(codigoJS);
        
    } else {
        console.log(`Se detectaron ${errorListener.errors.length} errores de sintaxis/lexema:\n`);
        errorListener.errors.forEach(err => console.log(`[ERROR] ${err}`));
        console.log("\n[!] Debido a los errores detectados, no se generó la traducción ni el árbol.");
    }
}

// Se ejecuta sobre el archivo input.txt actual
procesarAnalizador('input.txt');
