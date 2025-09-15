--seed.sql - Initial seed data for YIPL Library Management API(Development)

INSERT INTO authors (name, email) VALUES
('Krisha Tuladhar', 'krisha@authors.test'),
('Supreety Tamrakar', 'supp@authors.test'),
('Aiesha Shrestha', 'aiesha@authors.test');

INSERT INTO books (title, isbn, published_year, author_id) VALUES
('Javascript for Beginners', '1234567890', 2013, 1),
('C++ Advanced', '1111111111', 2022, 2),
('Dogs', '2222222222', 2025, 2),
('Dear john', '3333333333', 2023, 3);
