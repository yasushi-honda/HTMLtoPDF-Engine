import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: 'hello world' });
});

export default router; 