--seed.sql - Initial seed data for YIPL Library Management API (Testing)

INSERT INTO authors (name, email) VALUES
('Diya', 'diya@authors.test'),
('Miya', 'miya@authors.test'),
('Liya', 'liya@authors.test');

INSERT INTO books (title, isbn, published_year, author_id) VALUES
('Math', '1234567890', 2013, 1),
('Science', '1111111111', 2022, 2),
('English', '2222222222', 2025, 3);
