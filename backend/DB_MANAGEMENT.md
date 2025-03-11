# Database Management

This document describes the database management scripts and procedures for the LLM Flashcard application.

## Database Schema

The database schema is defined in `schema.sql` and includes the following tables:

- `users`: Stores user information
- `chats`: Stores chat sessions
- `messages`: Stores messages within chats
- `decks`: Stores flashcard decks
- `flashcards`: Stores individual flashcards
- `flashcard_reviews`: Stores review history for flashcards
- `migrations`: Tracks applied database migrations

## Migration System

The application uses a migration system to manage database schema changes. Migrations are SQL files stored in the `migrations` directory and are applied in order based on their filenames.

### Migration Files

- `000_migrations_table.sql`: Creates the migrations table to track applied migrations
- `001_initial_schema.sql`: Initial database schema
- `002_add_flashcard_features.sql`: Adds flashcard features (multiple decks per chat, deck description and color, flashcard difficulty tracking, review history)

### Running Migrations

To run migrations, use the `run-migrations.js` script:

```bash
node run-migrations.js
```

This script will:
1. Check which migrations have already been applied
2. Run any unapplied migrations in order
3. Record each successful migration in the migrations table

## Database Management Scripts

The following scripts are available for database management:

### `init-db.js`

Initializes the database with the schema from `schema.sql`. This is useful for setting up a new database.

```bash
node init-db.js
```

### `create-db.js`

Creates a new database with a specified name and initializes it with the schema. This is useful for creating a new database when the existing one has issues.

```bash
node create-db.js
```

### `delete-data.js`

Deletes all data from the database while preserving the schema. This is useful for clearing test data.

```bash
node delete-data.js
```

### `generate-mock-data.js`

Generates mock data for testing. This includes users, chats, messages, decks, flashcards, and flashcard reviews.

```bash
node generate-mock-data.js
```

### `reset-db.js`

Combines `delete-data.js` and `generate-mock-data.js` to reset the database with fresh mock data.

```bash
node reset-db.js
```

## Creating New Migrations

To create a new migration:

1. Create a new SQL file in the `migrations` directory with a name like `003_descriptive_name.sql`
2. Write the SQL commands to make the desired schema changes
3. Run the migrations using `run-migrations.js`

## Best Practices

- Always use migrations for schema changes to ensure they can be applied consistently across all environments
- Test migrations thoroughly in a development environment before applying them to production
- Back up the database before applying migrations in production
- Keep migrations small and focused on specific changes
- Include both "up" (apply) and "down" (rollback) logic in migrations when possible
