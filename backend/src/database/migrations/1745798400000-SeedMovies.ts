import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMovies1745798400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO movies (id, title, genre, "releaseYear", description, "posterUrl")
      VALUES
        (gen_random_uuid(), 'Inception',               'Sci-Fi',  2010, 'A thief who enters dreams.',                    NULL),
        (gen_random_uuid(), 'The Dark Knight',          'Action',  2008, 'Batman faces the Joker.',                       NULL),
        (gen_random_uuid(), 'Forrest Gump',             'Drama',   1994, 'Life is like a box of chocolates.',             NULL),
        (gen_random_uuid(), 'The Grand Budapest Hotel', 'Comedy',  2014, 'A concierge and his lobby boy.',                NULL),
        (gen_random_uuid(), 'Get Out',                  'Horror',  2017, 'A photographer meets his girlfriend''s family.',NULL),
        (gen_random_uuid(), 'Interstellar',             'Sci-Fi',  2014, 'Explorers travel through a wormhole.',          NULL),
        (gen_random_uuid(), 'Parasite',                 'Drama',   2019, 'Two families intertwine.',                      NULL),
        (gen_random_uuid(), 'Mad Max: Fury Road',       'Action',  2015, 'A woman escapes a tyrant.',                     NULL),
        (gen_random_uuid(), 'Superbad',                 'Comedy',  2007, 'Two friends try to buy alcohol.',               NULL),
        (gen_random_uuid(), 'Hereditary',               'Horror',  2018, 'A family unravels dark secrets.',               NULL)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM movies
      WHERE title IN (
        'Inception', 'The Dark Knight', 'Forrest Gump', 'The Grand Budapest Hotel',
        'Get Out', 'Interstellar', 'Parasite', 'Mad Max: Fury Road', 'Superbad', 'Hereditary'
      )
    `);
  }
}
