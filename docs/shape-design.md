# O raciocínio por trás das shapes

Essa é a parte que ninguém explica, e é o que separa um resultado bonito de um borrão.

Se você só quer saber o que cada controle faz, o lugar é o [manual](manual.md).

---

## O princípio: peso óptico, não desenho

Cada célula tem exatamente uma função: **representar uma quantidade de luz.** O olho não lê a forma individual da célula, ele lê a **quantidade de tinta** que aquela célula deposita naquela área. Isso se chama peso óptico ou densidade.

Então a regra é uma só:

> **A ordem dos 7 estados tem que ser uma rampa monotônica de área preenchida.**

Se o estado 3 tem menos tinta que o estado 4, a imagem quebra. O rosto some, aparece um relevo falso, e a leitura vira ruído. É o erro número um.

## Como calcular o peso de uma shape

Você não precisa de matemática. Faz o teste do olho semicerrado: coloca as 7 shapes lado a lado, aperta os olhos até desfocar, e elas têm que virar um degradê limpo do branco ao preto. Se alguma pular fora da ordem, troca ela de lugar ou redesenha.

A escala dos shapes padrão que estão em [`shapes/default/`](../shapes/default/), medida em área preenchida aproximada:

| Estado | Shape | Área preenchida |
|---|---|---|
| 1 · Highlights | Círculo r=46 | ~66% |
| 2 · Light mid | Quadrado arredondado 84×84 | ~68% de caixa, mas menos peso visual pelo canto |
| 3 · Mid high | Círculo r=34 | ~36% |
| 4 · Midtones | Losango | ~21% |
| 5 · Mid low | Anel (r=38, furo r=22) | ~30% de contorno, mas leitura mais leve pelo furo |
| 6 · Dark mid | Quadrado 28×28 | ~8% |
| 7 · Shadows | Ponto r=7 | ~1,5% |

Repare que não é uma rampa perfeitamente linear de porcentagem. **Área não é a mesma coisa que peso percebido.** Uma shape com furo no meio (o anel) lê mais leve do que a área dela sugere, porque o furo cria um respiro que o olho registra como luz. É por isso que ele está no estado 5 e não no 3.

## Por que cada família de shape serve pra uma zona

**Shapes sólidas e convexas nos extremos.** Círculo cheio, quadrado, disco. Nos highlights você quer massa contínua, porque as células vizinhas vão quase se tocar e formar uma superfície. Nas sombras você quer o oposto, um ponto isolado que o olho quase perde.

**Shapes com furo ou vazado nos meios-tons.** Anel, quadrado com furo, alvo. Essa é a jogada que dá aquela sensação de profundidade nos pôsteres do Makoto San. O furo cria uma segunda escala de leitura dentro da célula: de longe é um tom médio, de perto é um objeto gráfico. É o que faz o pôster funcionar tanto no feed quanto impresso a um metro.

**Shapes assimétricas só se você for usar rotação.** Um triângulo ou uma seta em grid fixo cria direção falsa, e o olho enxerga listras diagonais que não existem na foto. Com o snap de 90° ligado, essa direção se quebra e vira textura. Sem rotação, evite.

**Shapes finas e lineares são traiçoeiras.** Uma barra ou um traço tem área baixa mas contraste alto de borda, então ela lê mais escura do que a área diz. Se for usar traço, coloca ele um ou dois estados mais claro do que o cálculo de área sugere.

## Três direções de escala que funcionam

**1. Escala por tamanho (a mais segura).** Uma única shape, sete tamanhos. Círculo r=46, 38, 30, 22, 16, 10, 5. É o meio-tom de jornal clássico. Nunca dá errado, resultado limpo, leitura fotográfica perfeita. Comece por aqui quando estiver testando uma foto nova.
→ preset [`retrato-editorial.json`](../examples/retrato-editorial.json)

**2. Escala por densidade (a mais gráfica).** Sete shapes diferentes com peso decrescente, tipo o conjunto padrão. Dá personalidade e é onde entra a identidade da marca. É o que o Anton fez com as shapes do Makoto San.
→ preset [`poster-serigrafia.json`](../examples/poster-serigrafia.json)

**3. Escala por complexidade (a mais editorial).** Do mais complexo pro mais simples, mantendo área parecida. Highlight = shape com 3 elementos aninhados, sombra = ponto simples. Cria uma leitura de "resolução" em vez de leitura de "tom", e funciona muito bem em lettering e tipografia grande. Foi o que gerou os títulos MAKOTO SAN em grid no final do reel.
→ preset [`lettering.json`](../examples/lettering.json)

## Como montar o seu próprio conjunto

Fluxo prático no Illustrator:

1. Prancheta quadrada de 100×100px. **Sempre quadrada**, porque a ferramenta encaixa a shape numa célula quadrada e centraliza. Shape em prancheta retangular vai sair deformada ou com folga errada.
2. Desenha centralizado, deixando uma margem de segurança de uns 4 a 8% nas bordas. Shape encostando na borda gruda na vizinha e fecha a imagem.
3. Uma cor só, e converte tudo pra **traçado expandido**. Traço não expandido pode sair com espessura errada, porque a ferramenta escala a shape.
4. Junta tudo num caminho composto quando tiver furo, senão o furo vem preenchido.
5. Salva como SVG. Em *Exportar para telas* ou *Salvar como SVG*, escolhe **Perfil SVG 1.1**, propriedades de CSS em **Atributos de apresentação**, e desmarca **Preservar dados de edição do Illustrator** (isso é o que deixa o arquivo com 40KB de lixo).
6. Testa o conjunto inteiro na ferramenta com uma foto de rosto conhecida. Rosto é o teste mais duro, porque qualquer erro de rampa aparece na bochecha na hora.

Um atalho que funciona bem: pega um elemento da identidade da marca, o contraforma de uma letra, um detalhe do símbolo, uma forma do padrão gráfico, e gera as 7 variações **subtraindo massa progressivamente** em vez de desenhar sete coisas diferentes. O resultado fica coeso e a marca aparece na textura sem precisar de logo.

## Checklist antes de fechar um conjunto

- [ ] As 7 pranchetas são quadradas e do mesmo tamanho.
- [ ] Teste do olho semicerrado dá um degradê limpo, sem degrau invertido.
- [ ] Nada encosta na borda da prancheta.
- [ ] Traços expandidos, furos em caminho composto.
- [ ] Uma cor só por arquivo, a não ser que você vá desligar o *Fill solid* de propósito.
- [ ] Testado numa foto de rosto, não só em gradiente.
- [ ] Salvou como preset, pra não perder o conjunto.
