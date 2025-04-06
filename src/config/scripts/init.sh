#!/bin/bash
set -e

# Attendre que PostgreSQL soit prêt
until pg_isready -U "$POSTGRES_USER" -h localhost; do
    echo "En attente de PostgreSQL..."
    sleep 2
done

# Exécuter les scripts SQL dans l'ordre
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
    DROP DATABASE IF EXISTS $POSTGRES_DB;
    CREATE DATABASE $POSTGRES_DB;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
EOSQL

# Créer les tables et les triggers
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/01-schema.sql

# Insérer les données de test si nécessaire
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seed_test.sql 