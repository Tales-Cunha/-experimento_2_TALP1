# Student Assessment Management System (SAMS)

## Testing

The project includes a comprehensive test suite consisting of unit tests (Jest) and acceptance tests (Cucumber).

### Running all tests

To run the full test pipeline automatically, use the provided script:

```bash
./sistema/run-tests.sh
```

This script will:
1. Ensure the backend server is running (via Docker).
2. Wait for the API to be healthy.
3. Execute unit tests.
4. Execute acceptance tests.
5. Provide a summary of the results.

### Manual Testing

You can also run the test suites individually:

#### Unit Tests
```bash
npm run test:unit
```

#### Acceptance Tests
```bash
# Ensure DATA_DIR is set to your local data folder for hooks to work
DATA_DIR=$(pwd)/data npm run test:acceptance
```
