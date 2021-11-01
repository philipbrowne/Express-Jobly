'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require('./_testCommon');

let job1Id;

beforeAll(async () => {
  await commonBeforeAll();
  const jobsRes = await db.query(`
    INSERT INTO jobs(title, salary, equity, company_handle)
    VALUES ('J1', 100000, '0', 'c1'),
    ('J2', 50000, '0', 'c2')
    RETURNING id, title, salary, equity, company_handle AS "companyHandle"`);
  job1Id = jobsRes.rows[0].id;
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function () {
  const newJob = {
    title: 'New Job',
    salary: 5000,
    equity: 0.5,
    companyHandle: 'c1',
  };

  test('ok for admin', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: 'New Job',
        salary: 5000,
        equity: '0.5',
        companyHandle: 'c1',
      },
    });
  });

  test('not ok for regular user', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set('authorization', `Bearer ${u2Token}`);

    expect(resp.statusCode).toBe(401);
  });

  test('bad request with missing data', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({
        title: 'Missing Data',
        salary: 5000,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request with invalid data', async function () {
    const resp = await request(app)
      .post('/companies')
      .send({
        ...newJob,
        equity: 1.2,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe('GET /jobs', function () {
  test('ok for anon', async function () {
    const resp = await request(app).get('/jobs');
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: 'J1',
          salary: 100000,
          equity: '0',
          companyHandle: 'c1',
        },
        {
          id: expect.any(Number),
          title: 'J2',
          salary: 50000,
          equity: '0',
          companyHandle: 'c2',
        },
      ],
    });
  });

  test('fails: test next() handler', async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query('DROP TABLE jobs CASCADE');
    const resp = await request(app)
      .get('/jobs')
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:id', function () {
  test('works for anon', async function () {
    const resp = await request(app).get(`/jobs/${job1Id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: 'J1',
        salary: 100000,
        equity: '0',
        companyHandle: 'c1',
      },
    });
  });

  test('not found for no such job', async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:id', function () {
  test('works for admin', async function () {
    const resp = await request(app)
      .patch(`/jobs/${job1Id}`)
      .send({
        title: 'J4',
        equity: 0.3,
        salary: 120000,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: 'J4',
        salary: 120000,
        equity: '0.3',
        companyHandle: 'c1',
      },
    });
  });

  test('does partial update', async function () {
    const resp = await request(app)
      .patch(`/jobs/${job1Id}`)
      .send({
        title: 'J4',
        salary: 120000,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: 'J4',
        salary: 120000,
        equity: '0',
        companyHandle: 'c1',
      },
    });
  });

  test('unauth for anon', async function () {
    const resp = await request(app).patch(`/jobs/${job1Id}`).send({
      title: 'J4',
      equity: 0.3,
      salary: 120000,
    });
    expect(resp.statusCode).toEqual(401);
  });

  test('does not work for non-admin', async function () {
    const resp = await request(app)
      .patch(`/jobs/${job1Id}`)
      .send({
        title: 'J4',
        equity: 0.3,
        salary: 120000,
      })
      .set('authorization', `Bearer ${u2Token}`);
    expect(resp.statusCode).toBe(401);
  });

  test('not found on no such job', async function () {
    const resp = await request(app)
      .patch(
        `/jobs/0
      `
      )
      .send({
        title: 'J4',
        equity: 0.3,
        salary: 120000,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test('bad request on handle change attempt', async function () {
    const resp = await request(app)
      .patch(`/jobs/${job1Id}`)
      .send({
        companyHandle: 'c1-new',
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test('bad request on invalid data', async function () {
    const resp = await request(app)
      .patch(`/jobs/${job1Id}`)
      .send({
        equity: 1.5,
      })
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe('DELETE /jobs/:id', function () {
  test('works for admin', async function () {
    const resp = await request(app)
      .delete(`/jobs/${job1Id}`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${job1Id}` });
  });

  test('unauth for anon', async function () {
    const resp = await request(app).delete(`/jobs/${job1Id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('unauth for non-admin', async function () {
    const resp = await request(app)
      .delete(`/jobs/${job1Id}`)
      .set('authorization', `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test('not found for no such job', async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
