%{
  function ASTNode(type, args) {
    return {
      type: type,
      args: args
    }
  }
%}

/* lexical grammar */

%lex
%%
\s+                                                                                             {/* skip whitespace */}
'"'("\\"["]|[^"])*'"'                                                                           {return 'STRING';}
"'"('\\'[']|[^'])*"'"                                                                           {return 'STRING';}
[A-Za-z]{1,}[A-Za-z_0-9\.]+(?=[(])                                                              {return 'FUNCTION';}
'#'[A-Z0-9\/]+('!'|'?')?                                                                        {return 'ERROR';}
'$'[A-Za-z]+'$'[0-9]+                                                                           {return 'ABSOLUTE_CELL';}
'$'[A-Za-z]+[0-9]+                                                                              {return 'MIXED_CELL';}
[A-Za-z]+'$'[0-9]+                                                                              {return 'MIXED_CELL';}
[A-Za-z]+[0-9]+                                                                                 {return 'RELATIVE_CELL';}
[A-Za-z\.]+(?=[(])                                                                              {return 'FUNCTION';}
[A-Za-z]{1,}[A-Za-z_0-9]+                                                                       {return 'VARIABLE';}
[A-Za-z_]+                                                                                      {return 'VARIABLE';}
[0-9]+                                                                                          {return 'NUMBER';}
"&"                                                                                             {return '&';}
" "                                                                                             {return ' ';}
[.]                                                                                             {return 'DECIMAL';}
":"                                                                                             {return ':';}
";"                                                                                             {return ';';}
","                                                                                             {return ',';}
"*"                                                                                             {return '*';}
"/"                                                                                             {return '/';}
"-"                                                                                             {return '-';}
"+"                                                                                             {return '+';}
"^"                                                                                             {return '^';}
"("                                                                                             {return '(';}
")"                                                                                             {return ')';}
">"                                                                                             {return '>';}
"<"                                                                                             {return '<';}
"NOT"                                                                                           {return 'NOT';}
'"'                                                                                             {return '"';}
"'"                                                                                             {return "'";}
"!"                                                                                             {return "!";}
"="                                                                                             {return '=';}
"%"                                                                                             {return '%';}
[#]                                                                                             {return '#';}
"["                                                                                             {return '[';}
"]"                                                                                             {return ']';}
<<EOF>>                                                                                         {return 'EOF';}
/lex

/* operator associations and precedence (low-top, high-bottom) */
%left '='
%left '<=' '>=' '<>' 'NOT' '||'
%left '>' '<'
%left '+' '-'
%left '*' '/'
%left '^'
%left '&'
%left '%'
%left UMINUS

%start formula

%% /* language grammar */

formula
  : expression EOF {
      return $1;
    }
;

expression
  : variableSequence {
      $$ = ASTNode('variableSequence', $1);
    }
  | number {
      $$ = ASTNode('NUMBER', [parseInt($1)])
    }
  | STRING {
      $$ = ASTNode('STRING', [$1])
    }
  | expression '&' expression {
      $$ = ASTNode('AND_OP', [$1, $3])
    }
  | expression '=' expression {
      $$ = ASTNode('EQUALS_OP', [$1, $3])
    }
  | expression '+' expression {
      $$ = ASTNode('PLUS_OP', [$1, $3])
    }
  | '(' expression ')' {
      $$ = $2;
    }
  | expression '<' '=' expression {
      $$ = ASTNode('LEQ_OP', [$1, $4])
    }
  | expression '>' '=' expression {
      $$ = ASTNode('GEQ_OP', [$1, $4])
    }
  | expression '<' '>' expression {
      $$ = ASTNode('DIFF_OP', [$1, $4])
    }
  | expression NOT expression {
      $$ = ASTNode('NOT_OP', [$1, $3])
    }
  | expression '>' expression {
      $$ = ASTNode('GT_OP', [$1, $3])
    }
  | expression '<' expression {
      $$ = ASTNode('LT_OP', [$1, $3])
    }
  | expression '-' expression {
      $$ = ASTNode('MINUS_OP', [$1, $3])
    }
  | expression '*' expression {
      $$ = ASTNode('TIMES_OP', [$1, $3])
    }
  | expression '/' expression {
      $$ = ASTNode('DIV_OP', [$1, $3])
    }
  | expression '^' expression {
      $$ = ASTNode('POW_OP', [$1, $3])
    }
  | '-' expression {
      $$ = ASTNode('NEGATIVE_OP', [$2])
    }
  | '+' expression {
      $$ = ASTNode('POSITIVE_OP', [$2])
    }
  | FUNCTION '(' ')' {
      $$ = ASTNode('FUNCTION_CALL', [$1])
    }
  | FUNCTION '(' expseq ')' {
      $$ = ASTNode('FUNCTION_CALL', [$1, $3])
    }
  | cell
  | error
  | error error
;

cell
   : ABSOLUTE_CELL {
      $$ = ASTNode('ABSOLUTE_CELL', [$1])
    }
  | RELATIVE_CELL {
      $$ = ASTNode('RELATIVE_CELL', [$1])
    }
  | MIXED_CELL {
      $$ = ASTNode('MIXED_CELL', [$1])
    }
  | ABSOLUTE_CELL ':' ABSOLUTE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | ABSOLUTE_CELL ':' RELATIVE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | ABSOLUTE_CELL ':' MIXED_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | RELATIVE_CELL ':' ABSOLUTE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | RELATIVE_CELL ':' RELATIVE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | RELATIVE_CELL ':' MIXED_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | MIXED_CELL ':' ABSOLUTE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | MIXED_CELL ':' RELATIVE_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
  | MIXED_CELL ':' MIXED_CELL {
      $$ = ASTNode('CELL_RANGE', [$1, $3])
    }
;

expseq
  : expression {
      $$ = [$1];
    }
  | '[' expseq ']' {
      $$ = ASTNode('ARRAY', $2);
    }
  | expseq ';' expression {
      $1.push($3);
      $$ = $1;
    }
  | expseq ',' expression {
      $1.push($3);
      $$ = $1;
    }
;

variableSequence
  : VARIABLE {
      $$ = [$1];
    }
  | variableSequence DECIMAL VARIABLE {
      $$ = (Array.isArray($1) ? $1 : [$1]);
      $$.push($3);
    }
;

number
  : NUMBER {
      $$ = $1;
    }
  | NUMBER DECIMAL NUMBER {
      $$ = ($1 + '.' + $3) * 1;
    }
  | number '%' {
      $$ = $1 * 0.01;
    }
;

error
  : ERROR {
      $$ = ASTNode('ERROR', $1);
    }
;

%%
