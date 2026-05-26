# 🗄️ Guia de Implementação e Conexão Local com MySQL (Alternativa ao Firebase/Nuvem)

Se optar por utilizar este sistema de forma **100% Offline ou On-Premises** (dentro do próprio Hospital Pediátrico Pioneiro Zeca ou rede corporativa local, sem qualquer dependência à internet, Firebase, ou outros serviços em nuvem), siga este guia passo-a-passo para migrar os dados para o banco de dados **MySQL**.

---

## 🚀 1. Configurando o Banco de Dados MySQL Localmente

Pode executar o MySQL local na máquina do servidor através de uma das seguintes opções:

### Opção A: Usando XAMPP (Instalação Fácil no Windows)
1. Descarregue e instale o [XAMPP](https://www.apachefriends.org/index.html) no computador servidor.
2. Abra o **XAMPP Control Panel** e inicie o serviço **MySQL** clicando em "Start".
3. Aceda ao gerenciador web pelo navegador: `http://localhost/phpmyadmin/`.
4. Clique em "Importar", escolha o arquivo `schema.sql` que criamos na pasta `/mysql/schema.sql` e clique em executar.

### Opção B: Usando Docker (Para Administradores de Redes)
Execute o seguinte comando no terminal do seu servidor para criar o container local:
```bash
docker run --name mysql-hospital -e MYSQL_ROOT_PASSWORD=sua_senha_segura -p 3306:3306 -d mysql:latest
```
Em seguida, importe o arquivo `schema.sql`:
```bash
docker exec -i mysql-hospital mysql -u root -psua_senha_segura < schema.sql
```

---

## 💻 2. Adaptando a API Express do Servidor (`server.ts`) para MySQL

Atualmente, o ficheiro `server.ts` utiliza o Firestore do Firebase. Para utilizarmos o banco de dados do seu próprio servidor local, configure o Node.js seguindo o procedimento abaixo.

### Passo A: Instalar o Driver MySQL
Execute o seguinte comando no terminal do projeto para instalar a dependência oficial do MySQL para Node:
```bash
npm install mysql2
```

### Passo B: Adicionar as Variáveis do Banco de Dados no arquivo `.env`
Crie ou edite o ficheiro `.env` na raiz do projeto e declare a rota de dados do seu servidor fisicamente instalado:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_segura
DB_DATABASE=hospital_pioneiro_zeca
```

### Passo C: Adaptar o Conector de Banco de Dados localmente no Backend
Para substituir o Firestore do Firebase pelo MySQL no ficheiro `server.ts`, bastaria configurar o pool de ligações com o `mysql2/promise`:

```typescript
// server.ts
import mysql from 'mysql2/promise';

// Criar o pool de conexões com o MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sua_senha_segura',
  database: process.env.DB_DATABASE || 'hospital_pioneiro_zeca',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exemplo de Endpoint de Recolha de Dados para Obter os Pacientes da Triagem
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error: any) {
    console.error('Erro ao ler pacientes do MySQL:', error);
    res.status(500).json({ error: 'Erro de ligação local no servidor do Lubango.' });
  }
});

// Exemplo de Endpoint para Registar um Novo Paciente (Inserção no Banco Local)
app.post('/api/patients', async (req, res) => {
  const p = req.body;
  try {
    const sql = `
      INSERT INTO patients 
      (id, patientSerialId, name, gender, birthDate, age, ageGroup, occurrenceDate, entryTime, status, province, city, neighborhood, occurrenceType, signalsSymptoms, priority, state, receptionistId, receptionistSignature) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      p.id, p.patientSerialId, p.name, p.gender, p.birthDate, p.age, p.ageGroup, 
      p.occurrenceDate, p.entryTime, p.status, p.province, p.city, p.neighborhood, 
      p.occurrenceType, p.signalsSymptoms, p.priority, p.state, p.receptionistId, p.receptionistSignature
    ];
    
    await pool.query(sql, params);
    res.status(201).json({ success: true, message: 'Gravado com sucesso no servidor do hospital.' });
  } catch (error: any) {
    console.error('Erro ao inserir paciente no MySQL:', error);
    res.status(500).json({ error: 'Erro de processamento físico local.' });
  }
});
```

---

## 🔒 3. Vantagens do Sistema Integrado Localmente

1. **Independência Total de Internet**: Ideal para locais com instabilidade de ligação de banda larga no Lubango. O processamento ocorre 100% via rede interna corporativa sem consumo de dados móveis.
2. **Sem Custos Mensais de Nuvem**: Não há limites de escrita ou leitura baseados em taxas da Google Cloud/Firebase.
3. **Controle Total de Dados de Saúde**: Os dados clínicos sensíveis das crianças nunca deixam o ambiente físico do hospital, cumprindo as regulamentações mais rígidas de proteção de dados.
