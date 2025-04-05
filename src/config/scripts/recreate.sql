\c postgres

DROP DATABASE IF EXISTS archetype_warfare;
CREATE DATABASE archetype_warfare ENCODING 'UTF-8';

\c archetype_warfare

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;