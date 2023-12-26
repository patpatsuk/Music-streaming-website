drop database if exists `musik`;
create database if not exists `musik`;
use `musik`;


CREATE TABLE IF NOT EXISTS ad_min (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(20),
  last_name VARCHAR(20),
  username VARCHAR(20),
  password_hash VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS music (
  song_id INT PRIMARY KEY AUTO_INCREMENT,
  link VARCHAR(100),
  artist VARCHAR(50),
  title VARCHAR(100),
  updated_date DATE
);

-- Insert data into the admin table
INSERT INTO ad_min (staff_id, first_name, last_name, username, password_hash)
VALUES (1, 'Chattawat', 'Riyong', 'new', '$2b$10$yNj.r5lAHBNLM451sjhjdeixHxWMatjVA46fFOsOgV2bxYFEYteYW');

INSERT INTO ad_min (staff_id, first_name, last_name, username, password_hash)
VALUES (2, 'Kittipich', 'Aiumbhornsin', 'luke', '$2b$10$dRbu4RiLg9yH7HwOmCvO7eldJlO6tPUJnyiU3HGdaRM3DVFCkCV3y');

INSERT INTO ad_min (staff_id, first_name, last_name, username, password_hash)
VALUES (3, 'Pattaravit', 'Suksri', 'pat', '$2b$10$s0r3BXam/is6hh6ryDI0Yu/aA8TTQQnGR.IXRLbM3sRc/HPh9WSc6');

INSERT INTO ad_min (staff_id, first_name, last_name, username, password_hash)
VALUES (4, 'Pith', 'Thanawatcharakorn', 'pith', '$2b$10$mGpF.EEbgHXJrTcIBJR73e50GB3V2oXhgH5DqnYmtR7UDWzXVs/Ke');

-- Insert data into the music table
INSERT INTO music (song_id, link, title, artist,updated_date)
VALUES (1, 'https://www.youtube.com/watch?v=wjHgiSx0RNQ', 'The 1975' , 'Robbers', '2013-09-05');

INSERT INTO music (song_id, link, title,artist, updated_date)
VALUES (2, 'https://www.youtube.com/watch?v=2Z4m4lnjxkY', 'Queen' , 'Bohemian Rhapsody', '1975-10-31');

INSERT INTO music (song_id, link, title, artist, updated_date)
VALUES (3, 'https://www.youtube.com/watch?v=CHk5SWVO4p8', 'The 1975' , 'Chocolate', '2013-08-29');

INSERT INTO music (song_id, link, title,artist, updated_date)
VALUES (4, 'https://www.youtube.com/watch?v=LCkGsl2Qlzs', 'Mark Ronson' , 'Uptown Funk', '2014-11-10');


select * from ad_min;
select * from music;