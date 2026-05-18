grammar comando;

// Reglas Sintácticas
programa      : 'programa' IDENTIFICADOR '{' instruccion* '}' ;
instruccion   : asignacion ';' 
              | excepcion ';' 
              | bloque ';' 
              | imprimir ';' ;
              
asignacion    : IDENTIFICADOR '=' expresion ;
excepcion     : 'procesar' bloque 'manejarError' '(' IDENTIFICADOR ')' bloque ;
bloque        : '{' instruccion* '}' ;
imprimir      : 'Imprimir' '(' expresion ')' ;

expresion     : termino (('+' | '-') termino)* ;
termino       : NUMERO 
              | IDENTIFICADOR 
              | '(' expresion ')' ;

// Reglas Léxicas (Tokens)
IDENTIFICADOR : LETRA (LETRA | DIGITO | '_')* ;
NUMERO        : DIGITO+ ;

fragment LETRA  : [a-zA-Z] ;
fragment DIGITO : [0-9] ;

// Ignorar espacios en blanco y saltos de línea
WS            : [ \t\r\n]+ -> skip ;
