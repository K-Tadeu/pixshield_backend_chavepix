//importar as dependencias
const express = require('express');
const bodyParser=require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
 
//criar a conexão com o banco de dados
 
 
const db=mysql.createConnection({
    host:'localhost', //127.0.0.1
    user:'root', //usuario do mysql
    password:'anima123', //sua senha_usuario do mysql
    database:'ps_chaves' //nome_usuario do banco de dados
}
 
);
 
//Conectar com o banco de dados
 
db.connect((err)=>{
    if(err){
        console.error('Erro ao conectar no banco de dados');
        return;
    }
    console.log('Conectado com sucesso');
}
);
 
//Criar o App

var app=express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors())
 
//Rota inicial
 
app.get('/',(req, res)=>{
    res.send('API funcionando');
});
 
//Inserir os Dados (post)
 
app.post('/chave', (req, res) => {    
    const { valor_chave, numeroDenuncias_chave } = req.body;

    if (typeof valor_chave !== 'string' || valor_chave.trim().length === 0 || numeroDenuncias_chave === undefined) {
        console.error("Validação falhou para POST /chave. Recebido:", req.body);
        return res.status(400).json({ erro: 'O valor da chave PIX e o contador de denúncias (numeroDenuncias_chave: 0) são obrigatórios.' });
    }
    const numDenuncias = Number(numeroDenuncias_chave);
    if (isNaN(numDenuncias) || numDenuncias < 0) {
        return res.status(400).json({ erro: 'O contador de denúncias deve ser um número inteiro não negativo.' });
    }
    
    var sql = 'INSERT INTO chavepix (valor_chave, numeroDenuncias_chave) VALUES (?, ?)';
    
    db.query(sql, [valor_chave.trim(), numDenuncias], (err, result) => {
        if (err) {
            console.error('Erro ao Inserir Chave:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                 return res.status(409).json({ erro: 'Chave PIX já existe no sistema.' });
            }
            return res.status(500).json({ erro: 'Erro interno ao salvar chave.' });
        }
        res.status(201).json({ 
            mensagem: 'Chave criada com sucesso', 
            id: result.insertId,
            id_chave: result.insertId,
            valor_chave: valor_chave.trim()
        });
    });
});
 
//Listar todos os usuarios(Get)
 
app.get('/chave',(req, res)=>{
    db.query('SELECT valor_chave, numeroDenuncias_chave FROM chavepix',(err, results)=>{
        if(err){
            return res.status(500).json({erro:'Erro ao buscar chave'});
        }
        res.json(results);
    });
});
// Listar usuário pelo ID
 
app.get('/chave/:valor_chave',(req, res)=>{
    var {valor_chave}=req.params;
    db.query('SELECT * FROM chavepix WHERE valor_chave=?',[valor_chave],(err, results1)=>
    {
        if(err){
            return res.status(500).json({erro:'Erro ao Buscar chave'});
        }
        if(results1.length===0){
            return res.status(404).json({mensagem:'Chave não encontrado'});
        }
        res.json(results1[0]);
    }
);
});

app.get('/chave/contador/chaves',(req,res)=>{
    var sql='SELECT COUNT(*) FROM chavepix';
    db.query(sql,(err, results)=>{
        if(err){
            console.error('Erro ao buscar as chaves:',err);
            return res.status(500).json({erro:'Erro ao buscar no banco de dados'});
        }
        res.status(200).json(results);
    });
});

app.get('/chave/contador/denuncia',(req,res)=>{
    var sql='SELECT valor_chave FROM chavepix ORDER BY numeroDenuncias_chave DESC LIMIT 1;';
    db.query(sql,(err, results)=>{
        if(err){
            console.error('Erro ao buscar as chaves:',err);
            return res.status(500).json({erro:'Erro ao buscar no banco de dados'});
        }
        res.status(200).json(results);
    });
});

 
app.put('/chave/:id_chave',(req, res)=>{
    var {id_chave}=req.params;
    var {valor_chave, numeroDenuncias_chave}=req.body;
    if(!valor_chave || !numeroDenuncias_chave){
        return res.status(400).json({erro:'Todas as informações são obrigatórias'});
    }
    var sql='UPDATE chavepix SET valor_chave=?, numeroDenuncias_chave=? WHERE id_chave=?';
    db.query(sql,[valor_chave, numeroDenuncias_chave, id_chave],(err, result)=>{
        if(err){
            console.error('Erro ao atualizar:',err);
            return res.status(500).json({erro:'Erro ao atualizar no banco de dados'});
        }
        res.json({mensagem:'Chave atualizado com sucesso'});
    });
});

//contador de denuncias++
app.put('/chave/contadorsoma/:id_chave',(req, res)=>{
    var {id_chave}=req.params;
    var sql='UPDATE chavepix SET numeroDenuncias_chave = numeroDenuncias_chave + 1 WHERE id_chave=?';
    db.query(sql,[id_chave],(err, result)=>{
        if(err){
            console.error('Erro ao atualizar contador de denuncias:',err);
            return res.status(500).json({erro:'Erro ao atualizar no banco de dados'});
        }
        res.json({mensagem:'Contador de denuncias atualizado com sucesso'});
    });
});

//contador de denuncias--  
app.put('/chave/contadordiminui/:id_chave',(req, res)=>{
    var {id_chave}=req.params;
    var sql='UPDATE chavepix SET numeroDenuncias_chave = GREATEST(numeroDenuncias_chave - 1, 0) WHERE id_chave=?';
    db.query(sql,[id_chave],(err, result)=>{
        if(err){
            console.error('Erro ao atualizar contador de denuncias:',err);
            return res.status(500).json({erro:'Erro ao atualizar no banco de dados'});
        }
        res.json({mensagem:'Contador de denuncias atualizado com sucesso'});
    });
}
);
 
//Deletar um usuario
 
app.delete('/chave/:id_chave',(req, res)=>{
    var {id_chave}=req.params;
    var sql='DELETE FROM chavepix WHERE id_chave=?';
    db.query(sql,[id_chave],(err, result)=>{
        if(err){
            console.error('Erro ao deletar:',err);
            return res.status(500).json({erro:'Erro ao deletar no banco de dados'});
        }
        res.json({mensagem:'Chave deletada com sucesso'});
    }
);});
 
 
//inciar o servidor
 
app.listen(4000,()=>{
    console.log('Servidor rodando em http://localhost:4000');
})
 
