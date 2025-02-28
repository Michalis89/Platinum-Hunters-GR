import { rest } from 'msw';

export const handlers = [
  rest.get('/api/games', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          title: 'Elden Ring',
          platform: 'PS5',
          game_image: '/images/elden-ring.jpg',
          platinum: 1,
          gold: 3,
          silver: 10,
          bronze: 20,
        },
      ]),
    );
  }),

  rest.get('/api/games-error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }));
  }),
];
