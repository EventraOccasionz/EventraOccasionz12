# Task Implementation Template

Before starting any feature implementation or code modification, copy and complete this template.

## 1. Analysis
- **Goal**: (What feature are you implementing?)
- **Current State**: (What exists currently?)

## 2. Architecture Decision
- **Design Pattern**: (How does this fit into the modular architecture?)
- **Folder Location**: (Where will new files go?)

## 3. Impact Assessment & Risk Analysis
- **Files Affected**: (List every file that will be edited or moved)
- **Components Affected**: (List presentational components impacted)
- **Services Affected**: (List API, Database, or Auth services impacted)
- **Risk Level**: (LOW / MEDIUM / HIGH / CRITICAL)
- **Rollback Plan**: (What happens if the build fails?)

## 4. Implementation Steps
- [ ] Step 1: Draft types and database schema
- [ ] Step 2: Implement service layer functions
- [ ] Step 3: Implement presentational UI components
- [ ] Step 4: Hook UI into service layer
- [ ] Step 5: Verify build (`compile_applet`) and lint (`lint_applet`)
- [ ] Step 6: Document changes in `.ai/CHANGELOG.md`
