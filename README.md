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

### Workflow API

- `POST /api/Createworkflow` - Create a new workflow
- `GET /api/GetAllWorkflows` - Get all workflows for the authenticated user
- `GET /api/GetWorkflowById/:id` - Get a specific workflow by ID
- `POST /api/UpdateAutomationStatus` - Update the status of an automation

### Instagram API

- `POST /api/instagram/save-token` - Save Instagram access token
- `GET /api/instagram/status` - Check Instagram integration status
- `POST /api/instagram/webhook` - Handle Instagram webhook events
- `GET /api/instagram/settings` - Get Instagram settings
- `POST /api/instagram/settings` - Update Instagram settings
- `POST /api/instagram/exchange-token` - Exchange short-lived Instagram token for a long-lived token

## Testing

The project uses Jest for testing. The tests are organized into unit tests and integration tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

For more information about the tests, see the [tests/README.md](./tests/README.md) file.

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