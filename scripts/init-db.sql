-- Initialize databases for each microservice

-- Create databases
CREATE DATABASE IF NOT EXISTS testmgr_users;
CREATE DATABASE IF NOT EXISTS testmgr_agile;
CREATE DATABASE IF NOT EXISTS testmgr_code;
CREATE DATABASE IF NOT EXISTS testmgr_pipeline;
CREATE DATABASE IF NOT EXISTS testmgr_tests;
CREATE DATABASE IF NOT EXISTS testmgr_reports;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE testmgr_users TO testmgr;
GRANT ALL PRIVILEGES ON DATABASE testmgr_agile TO testmgr;
GRANT ALL PRIVILEGES ON DATABASE testmgr_code TO testmgr;
GRANT ALL PRIVILEGES ON DATABASE testmgr_pipeline TO testmgr;
GRANT ALL PRIVILEGES ON DATABASE testmgr_tests TO testmgr;
GRANT ALL PRIVILEGES ON DATABASE testmgr_reports TO testmgr;

-- User Admin Service Schema
\c testmgr_users;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id VARCHAR(36) REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

-- Agile Board Service Schema
\c testmgr_agile;

CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    sprint_duration_weeks INT DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sprints (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'planning',
    velocity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stories (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) REFERENCES boards(id) ON DELETE CASCADE,
    sprint_id VARCHAR(36) REFERENCES sprints(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'feature',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'backlog',
    estimate INT,
    assignee VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stories_board ON stories(board_id);
CREATE INDEX idx_stories_sprint ON stories(sprint_id);
CREATE INDEX idx_stories_status ON stories(status);

-- Code Tracer Service Schema
\c testmgr_code;

CREATE TABLE IF NOT EXISTS code_references (
    id VARCHAR(36) PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL,
    line_start INT NOT NULL,
    line_end INT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    function_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS code_story_links (
    code_ref_id VARCHAR(36) REFERENCES code_references(id) ON DELETE CASCADE,
    story_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (code_ref_id, story_id)
);

CREATE INDEX idx_code_file_path ON code_references(file_path);
CREATE INDEX idx_code_story_links_story ON code_story_links(story_id);

-- Pipeline Service Schema
\c testmgr_pipeline;

CREATE TABLE IF NOT EXISTS pipelines (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    repository VARCHAR(500),
    branch VARCHAR(255) DEFAULT 'main',
    status VARCHAR(50) DEFAULT 'idle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) REFERENCES pipelines(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    trigger VARCHAR(50),
    commit_sha VARCHAR(40),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS git_commits (
    sha VARCHAR(40) PRIMARY KEY,
    repository VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    message TEXT,
    committed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pipeline_runs_pipeline ON pipeline_runs(pipeline_id);
CREATE INDEX idx_git_commits_repo ON git_commits(repository);

-- Test Management Service Schema
\c testmgr_tests;

CREATE TABLE IF NOT EXISTS tests (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'automated',
    status VARCHAR(50) DEFAULT 'active',
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_results (
    id VARCHAR(36) PRIMARY KEY,
    test_id VARCHAR(36) REFERENCES tests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    duration_ms INT,
    error_message TEXT,
    stack_trace TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_story_links (
    test_id VARCHAR(36) REFERENCES tests(id) ON DELETE CASCADE,
    story_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (test_id, story_id)
);

CREATE TABLE IF NOT EXISTS defects (
    id VARCHAR(36) PRIMARY KEY,
    test_id VARCHAR(36) REFERENCES tests(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    root_cause TEXT,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'bug',
    severity VARCHAR(50) DEFAULT 'medium',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assignee VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_comments (
    id VARCHAR(36) PRIMARY KEY,
    issue_id VARCHAR(36) REFERENCES issues(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_results_test ON test_results(test_id);
CREATE INDEX idx_test_story_links_story ON test_story_links(story_id);
CREATE INDEX idx_defects_test ON defects(test_id);
CREATE INDEX idx_defects_status ON defects(status);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);

-- Reporting Service Schema
\c testmgr_reports;

CREATE TABLE IF NOT EXISTS metrics_cache (
    id VARCHAR(36) PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_type ON metrics_cache(metric_type);
CREATE INDEX idx_metrics_expires ON metrics_cache(expires_at);
CREATE INDEX idx_reports_type ON report_snapshots(report_type);
CREATE INDEX idx_reports_created ON report_snapshots(created_at);
