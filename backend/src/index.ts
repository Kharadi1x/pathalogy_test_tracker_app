import express from 'express';
import dotenv from 'dotenv';
import prismaClient from './prismaClient';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.send({ status: 'ok' }));

app.listen(process.env.PORT || 4000, () => {
  console.log('Backend running on port', process.env.PORT || 4000);
});
