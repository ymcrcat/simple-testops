import { db } from "./lib/db";
import crypto from "crypto";

const d = db();

// Create project
const proj = d.prepare("INSERT INTO projects (name, slug) VALUES (?, ?)").run("Demo Project", "demo");
const projectId = proj.lastInsertRowid;

// Create API key
const rawKey = "testops-demo-key-12345";
const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
d.prepare("INSERT INTO api_keys (project_id, key_hash, name) VALUES (?, ?, ?)").run(projectId, keyHash, "Demo Key");

// Create features
const f1 = d.prepare("INSERT INTO features (project_id, name, description) VALUES (?, ?, ?)").run(projectId, "Authentication", "User auth flows");
const f2 = d.prepare("INSERT INTO features (project_id, name, description) VALUES (?, ?, ?)").run(projectId, "Dashboard", "Dashboard functionality");

// Create stories
const s1 = d.prepare("INSERT INTO stories (feature_id, name, description) VALUES (?, ?, ?)").run(f1.lastInsertRowid, "Login", "User login flow");
const s2 = d.prepare("INSERT INTO stories (feature_id, name, description) VALUES (?, ?, ?)").run(f1.lastInsertRowid, "Registration", "New user registration");
const s3 = d.prepare("INSERT INTO stories (feature_id, name, description) VALUES (?, ?, ?)").run(f2.lastInsertRowid, "Widgets", "Dashboard widgets");

// Create test cases
const cases = [
  { story_id: s1.lastInsertRowid, name: "test_login_valid_credentials", class_name: "tests.test_auth.TestLogin" },
  { story_id: s1.lastInsertRowid, name: "test_login_invalid_password", class_name: "tests.test_auth.TestLogin" },
  { story_id: s1.lastInsertRowid, name: "test_login_empty_fields", class_name: "tests.test_auth.TestLogin" },
  { story_id: s2.lastInsertRowid, name: "test_register_new_user", class_name: "tests.test_auth.TestRegister" },
  { story_id: s2.lastInsertRowid, name: "test_register_duplicate_email", class_name: "tests.test_auth.TestRegister" },
  { story_id: s3.lastInsertRowid, name: "test_dashboard_loads", class_name: "tests.test_dashboard.TestDashboard" },
  { story_id: s3.lastInsertRowid, name: "test_widget_count", class_name: "tests.test_dashboard.TestDashboard" },
];

const insertCase = d.prepare("INSERT INTO test_cases (story_id, name, class_name) VALUES (?, ?, ?)");
for (const tc of cases) {
  insertCase.run(tc.story_id, tc.name, tc.class_name);
}

console.log("Seed data created!");
console.log(`API Key: ${rawKey}`);
console.log(`Project slug: demo`);
