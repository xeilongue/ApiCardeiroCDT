import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";

const app = express();
const prisma = new PrismaClient(); // Prisma
const PORT = 3002

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
const SECRET = "seu_segredo_aqui";

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

// **USUÁRIOS**

// Criar usuário
app.post('/users', async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await prisma.user.create({
            data: {
                email: req.body.email,
                name: req.body.name,
                password: hashedPassword
            }
        });
        res.status(201).json({
            email: req.body.email,
            name: req.body.name
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
    }
});

// Remova a primeira rota de login e mantenha apenas esta
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({  // Note: changed User to user
            where: { email: email }
        });

        if (!user) {
            console.log(`Usuário não encontrado: ${email}`);
            return res.status(406).json({ message: 'Usuário não encontrado' });
        }

        const senhaCorreta = await bcrypt.compare(password, user.password);
        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
        res.status(200).json({ 
            message: 'Login bem-sucedido', 
            token: token,
            userId: user.id,
            name: user.name
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Editar usuário
app.put('/users/:id', async (req, res) => {
    try {
        // Primeiro, busca o usuário atual
        const currentUser = await prisma.user.findUnique({
            where: {
                id: req.params.id
            }
        });

        if (!currentUser) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Se uma nova senha foi fornecida, verifica a senha antiga
        if (req.body.password) {
            const passwordMatch = await bcrypt.compare(req.body.oldPassword, currentUser.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Senha atual incorreta' });
            }
        }

        const updateData = {
            email: req.body.email,
            name: req.body.name,
        };

        // Se uma nova senha foi fornecida e a antiga foi verificada, criptografa a nova
        if (req.body.password) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: req.params.id
            },
            data: updateData
        });

        res.status(200).json({
            message: 'Usuário atualizado com sucesso',
            email: updatedUser.email,
            name: updatedUser.name
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: error.message });
    }
});

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