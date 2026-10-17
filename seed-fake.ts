import { runSeed } from '../server/seed.js';

console.log('Executando seed de dados 100% fictícios (LGPD Safe)...');
runSeed(true)
  .then(() => {
    console.log('Seed de dados fictícios finalizado com sucesso!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Falha ao rodar seed-fake:', err);
    process.exit(1);
  });
