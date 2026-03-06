# TestOps

Test management service for organizing test cases by features and stories, running test suites, and uploading JUnit XML results via CLI. Includes a web UI for browsing and managing everything.

## Tech Stack

- **Web + API**: Next.js (React) with App Router + API Route Handlers + SQLite (better-sqlite3)
- **CLI**: TypeScript CLI (commander.js)
- **Monorepo**: npm workspaces

## Setup

```bash
npm install
```

## Running

Start the app (port 3001):

```bash
cd packages/web
npm run dev
```

This serves both the web UI and the API at `http://localhost:3001`.

## Seed Data

Populate the database with demo data:

```bash
cd packages/web
npm run seed
```

This creates a "Demo Project" with features, stories, test cases, and an API key: `testops-demo-key-12345`.

## API

All endpoints are under `/api`.

### Projects

```
GET    /api/projects
POST   /api/projects          { "name": "My Project" }
GET    /api/projects/:id
PUT    /api/projects/:id      { "name": "New Name" }
DELETE /api/projects/:id
POST   /api/projects/:id/api-keys  { "name": "CI Key" }
GET    /api/projects/:id/api-keys
```

### Features

```
GET    /api/features?project_id=1
POST   /api/features          { "project_id": 1, "name": "Auth" }
PUT    /api/features/:id      { "name": "New Name" }
DELETE /api/features/:id
```

### Stories

```
GET    /api/stories?feature_id=1
POST   /api/stories           { "feature_id": 1, "name": "Login" }
PUT    /api/stories/:id       { "name": "New Name" }
DELETE /api/stories/:id
```

### Test Cases

```
GET    /api/testcases?project_id=1
GET    /api/testcases?story_id=1
GET    /api/testcases/:id
GET    /api/testcases/:id/history
POST   /api/testcases         { "story_id": 1, "name": "test_login", "class_name": "tests.TestAuth" }
PUT    /api/testcases/:id
DELETE /api/testcases/:id
```

### Test Runs

```
GET    /api/runs?project_id=1
GET    /api/runs/:id
GET    /api/runs/:id/results
GET    /api/runs/:id/results?status=failed
DELETE /api/runs/:id
```

### Upload Results

```
POST   /api/runs/upload       { "project_id": "demo", "xml": "<testsuite>...</testsuite>" }
```

Accepts JUnit XML content. The server parses the XML and automatically matches results to existing test cases by `class_name` + `name`.

## CLI

### Login

```bash
testops login --url http://localhost:3001 --key <api-key>
```

Saves configuration to `~/.testops/config.json`.

### Upload Results

```bash
# Single file
testops upload --project demo --file results.xml

# All XML files in a directory
testops upload --project demo --dir ./test-results

# With inline credentials (no login needed)
testops upload --project demo --file results.xml --url http://localhost:3001 --key <api-key>
```

## Feature & Story Mapping via Pytest Properties

TestOps maps test results to features and stories. You can control this mapping by embedding `feature` and `story` properties in your JUnit XML output.

### Setup

1. Define custom pytest markers in `conftest.py`:

```python
import pytest

def pytest_configure(config):
    config.addinivalue_line("markers", "feature(name): assign test to a feature")
    config.addinivalue_line("markers", "story(name): assign test to a story")

@pytest.hookimpl(tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Inject feature/story markers as JUnit XML properties."""
    if call.when == "call":
        for marker_name in ("feature", "story"):
            marker = item.get_closest_marker(marker_name)
            if marker and marker.args:
                item.user_properties.append((marker_name, marker.args[0]))
```

2. Annotate your tests:

```python
import pytest

@pytest.mark.feature("Authentication")
@pytest.mark.story("Login")
class TestLogin:
    def test_login_valid_credentials(self):
        ...

    def test_login_invalid_password(self):
        ...

@pytest.mark.feature("Authentication")
@pytest.mark.story("Registration")
class TestRegister:
    def test_register_new_user(self):
        ...
```

3. Run with JUnit XML output:

```bash
pytest --junitxml=results.xml
```

This produces `<properties>` elements inside each `<testcase>`:

```xml
<testcase classname="tests.test_auth.TestLogin" name="test_login_valid_credentials">
  <properties>
    <property name="feature" value="Authentication"/>
    <property name="story" value="Login"/>
  </properties>
</testcase>
```

### Fallback Behavior

When no `feature`/`story` properties are present, TestOps derives them from the `classname` attribute:

- `tests.test_auth.TestLogin` → feature=`test_auth`, story=`TestLogin`
- Last segment = story, second-to-last = feature

## Typical Workflow

1. Create a project via the API or web UI
2. Define features, stories, and test cases
3. Generate an API key for the project
4. Run your tests with JUnit XML output (e.g. `pytest --junitxml=results.xml`)
5. Upload results: `testops upload --project <slug> --file results.xml`
6. Browse results at `http://localhost:3001`
