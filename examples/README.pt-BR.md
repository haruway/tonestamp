**Português** · [English](README.md)

# Presets de exemplo

Quatro configurações prontas, uma pra cada combinação documentada no
[manual](../docs/manual.md#combinações-que-já-sei-que-funcionam).

Pra usar: abra a ferramenta, seção **Presets** → **Carregar preset** → escolha o
`.json`. Ele restaura os parâmetros, as cores e as **shapes**, que vão embutidas
no arquivo.

| Preset | Grid | Modo de cor | O que é |
|---|---|---|---|
| [`retrato-editorial.json`](retrato-editorial.json) | 90 | Estado | Escala por tamanho: um círculo em sete raios (46→5). Preto e branco, gamma 0.85, scale ligado. O meio-tom de jornal. Comece por aqui numa foto nova. |
| [`poster-serigrafia.json`](poster-serigrafia.json) | 55 | Quantizar | Sete shapes sólidas sem furo, paleta de 3 cores, saturação +70, max size 92% pra abrir grade. O look chapado de serigrafia. |
| [`lettering.json`](lettering.json) | 34 | Estado | Escala por complexidade: de três anéis aninhados até um ponto. Estado 7 desligado, rotação 90° a cada 1600ms. Pra título e tipografia grande. |
| [`blocos.json`](blocos.json) | 100 | Estado | Quadrados sólidos que se encostam no highlight e encolhem na sombra. Preto no branco, contraste +20, saída 2040px. O aspecto duro de grid impresso. Usa o conjunto [`blocks`](../shapes/blocks/). |
| [`textura-fundo.json`](textura-fundo.json) | 160 | Estado | Uma única shape nos sete estados, só a cor muda. Ruído fino em tons quentes dessaturados, pra usar atrás de tipografia. |

Os presets **não guardam a imagem**. Carregue a sua fonte primeiro, depois o
preset — ou o contrário, tanto faz.

## Formato

```jsonc
{
  "format": "tonestamp-preset",  // recusado se for outra coisa
  "version": 1,                   // recusado se for maior que a build entende
  "created": "2026-08-19T00:00:00.000Z",
  "params": { /* todos os campos de S */ },
  "states": [ { "on": true, "color": "#ffffff", "name": "…", "svgText": "<svg …>" } ],
  "palette": [ [244, 233, 216] ]
}
```

Valores numéricos fora de faixa são cortados pro limite mais próximo em vez de
recusar o arquivo inteiro. Já `format`, `version` e a estrutura dos 7 estados
são obrigatórios — se falharem, a ferramenta mostra o motivo e não aplica nada.
