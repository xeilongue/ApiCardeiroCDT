import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client"; // Prisma
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";

const app = express();
const prisma = new PrismaClient(); // Prisma
const PORT = 8083

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
const SECRET = "seu_segredo_aqui";

//const users = []; // Comentar se for usar Prisma
/*
app.use('/', (req,res) => {
    res.json({
        status: "API working fine",
        code: 200
    })
})*/

app.post('/login/google', async (req, res) => {
    const { email, name } = req.body;
  
    try {
      // Verifique se o usuário já existe
      let user = await prisma.user.findUnique({ where: { email } });
  
      if (!user) {
        // Cria o usuário automaticamente se não existir
        user = await prisma.user.create({
          data: { email, name, password: '' }, // Password pode ser vazio
        });
      }
  
      // Gere o token JWT para autenticação
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login com Google bem-sucedido', token, userId: user.id });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao autenticar com Google', error: error.message });
    }
  }); 

app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await prisma.User.findUnique({
            where: { email: email }
        });

        if (!user) {
            console.log(`Usuário não encontrado: ${email}`);
            return res.status(406).json({ message: 'Usuário não encontrado' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido', token: token });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// **USUÁRIOS**

// Criar usuário
app.post('/users', async (req,res) => {
    //users.push(req.body);
    await prisma.user.create({ // Prisma
        data: {
            email: req.body.email,
            name: req.body.name,
            password: req.body.password
        }
    });


    res.status(201).json(req.body);
})

// Consultar apenas um usuário pelo ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        if (user) {
            // Criando as iniciais caso não tenha imagem
            const initials = user.name.split(' ').map(word => word[0]).join(' ');
            res.status(200).json({ ...user, initials });
        } else {
            res.status(404).json({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Consultar usuário
app.get('/users', async (req,res) => {
    let users = [];

    if(req.query){
        users = await prisma.user.findMany({
            where: {
                email: req.query.email,
            }
        }); // Prisma
    } else {
        users = await prisma.user.findMany();
    }
    
    res.status(200).json(users);
});

// Editar usuário
app.put('/users/:id', async (req,res) => {
    //users.push(req.body);
    await prisma.user.update({ // Prisma
        where: {
            id: req.params.id
        },
        data: {
            email: req.body.email,
            name: req.body.name,
            password: req.body.password
        }
    });

    res.status(201).json(req.body);
})

// Deletar usuário
app.delete('/users/:id', async (req,res) => {
    //users.push(req.body);
    await prisma.user.delete({ // Prisma
        where: {
            id: req.params.id
        }
    });

    res.status(200).json({message: 'Usuário deletado com Sucesso!'});
})


//321cardeiro123


// **SUPORTE**

// Criar suporte
app.post('/suporte', async (req, res) => {
    try {
        const suporte = await prisma.Suporte.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                telefone: req.body.telefone,
                contato: req.body.contato,
                problema: req.body.problema,
                descricao: req.body.descricao
            }
        });
        res.status(201).json(suporte);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar suporte', error: error.message });
    }
});

// Consultar todos os suportes
app.get('/suporte', async (req, res) => {
    try {
        const suportes = await prisma.Suporte.findMany();
        res.status(200).json(suportes);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar suportes', error: error.message });
    }
});

// Consultar suporte por ID
app.get('/suporte/:id', async (req, res) => {
    try {
        const suporte = await prisma.Suporte.findUnique({
            where: { idSuporte: req.params.id }
        });
        
        if (suporte) {
            res.status(200).json(suporte);
        } else {
            res.status(404).json({ message: 'Suporte não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar suporte', error: error.message });
    }
});

// Atualizar suporte
app.put('/suporte/:id', async (req, res) => {
    try {
        const suporte = await prisma.Suporte.update({
            where: { idSuporte: req.params.id },
            data: {
                name: req.body.name,
                email: req.body.email,
                telefone: req.body.telefone,
                contato: req.body.contato,
                problema: req.body.problema,
                descricao: req.body.descricao
            }
        });
        res.status(200).json(suporte);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar suporte', error: error.message });
    }
});

// Deletar suporte
app.delete('/suporte/:id', async (req, res) => {
    try {
        await prisma.Suporte.delete({
            where: { idSuporte: req.params.id }
        });
        res.status(200).json({ message: 'Suporte deletado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar suporte', error: error.message });
    }
});

app.listen(PORT)