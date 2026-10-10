# Controle de Compras 2026

Sistema em HTML, CSS e JavaScript que reproduz a planilha `controle_compras_2026`.
O banco de dados é o arquivo **`db.json`**, nesta mesma pasta. Não usa nenhuma integração nem pacote externo.

## Como usar

1. Instale o [Node.js](https://nodejs.org) (só ele, nenhum `npm install`).
2. Inicie o servidor:
   - **Windows:** clique duas vezes em `iniciar.bat`
   - **Mac/Linux:** `./iniciar.sh` ou `node server.js`
3. Abra **http://localhost:3000**.

Toda alteração é gravada sozinha no `db.json`, e a versão anterior fica em `db.backup.json`.

**No celular:** com o computador e o celular no mesmo Wi-Fi, abra o endereço que o terminal mostra
(ex.: `http://192.168.0.10:3000`). Os dois usam o mesmo `db.json`.

## Sem servidor

Abrindo o `index.html` direto (duplo clique), o sistema funciona e guarda os dados no navegador.
No botão **Banco de dados** dá para:

- **Exportar db.json** — baixa uma cópia do banco
- **Importar db.json** — carrega um banco salvo
- **Abrir db.json do computador** (Chrome/Edge) — passa a gravar direto nesse arquivo

## Arquivos

| Arquivo        | O que é                                             |
|----------------|-----------------------------------------------------|
| `index.html`   | Estrutura da página                                 |
| `style.css`    | Visual (desktop e celular)                          |
| `app.js`       | Regras da planilha, telas e leitura/gravação do banco |
| `server.js`    | Servidor local que serve a página e grava o `db.json` |
| `db.json`      | Banco de dados (já vem com os dados da planilha)    |

## Formato do db.json

```json
{
  "app": "controle-compras",
  "versao": 1,
  "ano": 2026,
  "atualizadoEm": "2026-10-10T03:48:07.841Z",
  "meses": {
    "Janeiro": [
      {
        "id": "a1b2c3d4",
        "categoria": "Limpeza",
        "item": "Sabonete",
        "qtd": 2,
        "comprado": false,
        "precoUnit": 12,
        "marca": "",
        "observacoes": ""
      }
    ]
  }
}
```

Categorias: `Limpeza`, `Grosso`, `Salgado/Frios`, `Frutas e Verduras`.
Preço total, valor do mês passado, economia e todo o dashboard são calculados, não ficam gravados.

## Divisão de Faxina

No topo, toque no nome do sistema para trocar entre **Controle de Compras** e **Divisão de Faxina**.

- Cada semana (segunda a domingo) tem sua lista. Peso: **pesada = 3 pts**, **média = 2 pts**, **leve = 1 pt**.
- Cada tarefa é de uma pessoa (Gabriel ou Letícia), **Juntos** ou sem responsável.
- Situação: pendente, feita ou **não fez**. Só as tarefas feitas somam pontos; "não fez" fica registrado.
- **Sugerir divisão** distribui as tarefas pendentes deixando os pontos o mais parecidos possível.
- Tarefas marcadas como "Repetir toda semana" são copiadas quando uma semana nova é criada.
- A aba **Histórico** mostra os pontos de cada pessoa por semana.

No `db.json` a faxina fica na chave `faxina` (a chave `meses` não mudou):

```json
"faxina": {
  "pessoas": ["Gabriel", "Letícia"],
  "tarefasFixas": [{ "id": "f1", "nome": "Varrer casa", "peso": 3, "juntos": false }],
  "semanas": {
    "2026-10-05": [
      { "id": "t1", "fixaId": "f1", "nome": "Varrer casa", "peso": 3, "responsavel": "Gabriel", "status": "pendente" }
    ]
  }
}
```

`status`: `pendente`, `feito` ou `naofez`. `responsavel`: nome da pessoa, `Juntos` ou vazio.

## Deploy na Vercel

O projeto sobe na Vercel como site estático, sem configuração (nenhum build, `index.html` na raiz).
Na Vercel não existe disco para gravar, então lá o sistema roda no modo **navegador**: os dados ficam
no aparelho de quem usa, com Exportar/Importar `db.json` no botão **Banco de dados**.
A gravação automática no `db.json` acontece rodando localmente com `node server.js`.
