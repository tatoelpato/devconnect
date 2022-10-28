create table users (
    name varchar not null,
    email varchar unique,
    password varchar not null,
    avatar varchar,
    date timestamp not null default CURRENT_TIMESTAMP
) 