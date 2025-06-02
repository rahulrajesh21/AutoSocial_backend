# AutoSocial Backend

## Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one already
2. Create a new project in Supabase
3. Get your Supabase URL and service role key from the project settings:
   - Go to Project Settings > API
   - Copy the Project URL and service_role key

4. Create a `.env` file in the root directory with the following:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Installation

```bash
npm install
```

## Running the Server

```bash
npm run dev
```

## API Endpoints

### Data API

- `GET /api/data/:table` - Get all items from a table
- `POST /api/data/:table` - Create a new item in a table

## Example Usage

### Fetching data from a table

```javascript
// Example: GET /api/data/users
const response = await fetch('/api/data/users');
const data = await response.json();
console.log(data);
```

### Creating a new item

```javascript
// Example: POST /api/data/users
const response = await fetch('/api/data/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});
const data = await response.json();
console.log(data);
``` 