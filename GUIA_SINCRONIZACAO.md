# Guia de Sincronização de Banco de Dados

Este guia explica como garantir que as alterações feitas no sistema (patrimônios, salas, usuários) sejam transportadas entre computadores diferentes usando o GitHub.

## Fluxo de Trabalho (WorkFlow)

Para que a sincronização funcione, você deve seguir estes passos sempre que trocar de computador.

---

### 1. No Computador Atual (Onde você trabalhou)
Antes de enviar o código para o GitHub, você precisa "congelar" o estado do banco de dados no arquivo.

1.  Certifique-se de que o **XAMPP** está rodando (Apache e MySQL).
2.  Acesse o link: [http://localhost/patrimonio/Patrimonio/api/export.php](http://localhost/patrimonio/Patrimonio/api/export.php)
3.  Você verá uma mensagem de sucesso confirmando que o arquivo `database.sql` foi atualizado.
4.  No **GitHub Desktop** (ou terminal), você verá que o arquivo `database.sql` foi modificado.
5.  Faça o **Commit** e depois o **Push** para enviar ao GitHub.

---

### 2. No Novo Computador (Onde você vai continuar)
Após baixar as atualizações, você precisa "injetar" os dados no seu MySQL local.

1.  Abra o **GitHub Desktop** e faça o **Pull** (Fetch origin) para baixar as alterações.
2.  Certifique-se de que o **XAMPP** está rodando.
3.  Acesse o link: [http://localhost/patrimonio/Patrimonio/api/setup.php](http://localhost/patrimonio/Patrimonio/api/setup.php)
4.  Você verá uma mensagem confirmando que o banco de dados foi sincronizado.
5.  Pronto! Seu sistema agora tem os mesmos dados do outro computador.

---

## Dicas Importantes
*   **Não esqueça o Export:** Se você fizer alterações e não rodar o `export.php` antes do Push, os dados novos **não** serão enviados.
*   **Limpeza:** O script de Importação (`setup.php`) apaga o banco local e cria um novo a partir do arquivo. Isso garante que não haja duplicidade, mas lembre-se de exportar sempre do PC mais atualizado.
*   **XAMPP:** Os links acima consideram que sua pasta está em `htdocs/patrimonio/Patrimonio`. Se a estrutura for diferente, ajuste a URL.
